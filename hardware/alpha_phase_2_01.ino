// sensor_phase_2.ino
// GPS Sensor Integration (lat lon) using tinyGPSPlus library
// Features:
// - Real GPS coordinates from GPS module
// - GPS status monitoring
// - Fallback to default coordinates when GPS unavailable

#include <Wire.h>
#include <BH1750.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <FS.h>
#include <SD.h>
#include <SPI.h>
#include <time.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

BH1750 lightMeter;
TinyGPSPlus gps;
HardwareSerial ss(2); // Use Serial2 for GPS module

const int sdCsPin = 5;                 // CS wired to GPIO5
const int sdMisoPin = 19;              // MISO wired to GPIO19
const int sdMosiPin = 23;              // MOSI wired to GPIO23
const int sdSckPin = 18;               // SCK wired to GPIO18
const char* sdDataFilePath = "/alpha_1.json";
bool sdAvailable = false;
const int TIMEZONE_OFFSET_SECONDS = 8 * 3600; // UTC+08

const char* ssid = "PLDTHOMEFIBReU2Fh";
const char* password = "PLDTWIFI95WZm";
const char* backendURL = "https://liwanag-backend.onrender.com/";
const char* postURL = "https://liwanag-backend.onrender.com/api/v1/sensor-demo-batch";
const char* deviceOnlineURL = "https://liwanag-backend.onrender.com/api/v1/device-online";
const char* deviceRestartURL = "https://liwanag-backend.onrender.com/api/v1/device-restart";
const char* startMissionURL = "https://liwanag-backend.onrender.com/api/v1/start-mission?device_id=1001";
const char* stopMissionURL = "https://liwanag-backend.onrender.com/api/v1/stop-mission?device_id=1001";

// new variables
const char* sensor = "Alpha";   // this will be passed to JSON as sensor property

bool startMission = false;      // this will be controlled from the web through api
bool bulkMode = false;          // if no wifi, sensor will still collect but store first in sd card

// timing variables for heartbeat and mission control
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000; // 30 seconds

unsigned long lastMissionCheck = 0;
const unsigned long missionCheckInterval = 2000; // 2 seconds

unsigned long lastGPSStatus = 0;
const unsigned long gpsStatusInterval = 60000; // 60 seconds - print GPS status

// device info
const int deviceId = 1001; 
const char* deviceName = "Alpha";

// GPS configuration
const unsigned long gpsTimeout = 5000; // 5 seconds timeout for GPS reading
float defaultLat = 0.000000;  // Default coordinates (Manila area)
float defaultLon = 0.000000;
float currentLat = defaultLat;
float currentLon = defaultLon;
bool gpsAvailable = false;

struct Measurement {
  float lat;
  float lon;
  float lux;
  String timestamp;
  bool gpsFix;
};

String lastKnownTimestamp = "";
time_t lastKnownEpoch = 0;
unsigned long lastEpochSyncMillis = 0;

int monthStringToNumber(const char* month) {
  if (strncmp(month, "Jan", 3) == 0) return 1;
  if (strncmp(month, "Feb", 3) == 0) return 2;
  if (strncmp(month, "Mar", 3) == 0) return 3;
  if (strncmp(month, "Apr", 3) == 0) return 4;
  if (strncmp(month, "May", 3) == 0) return 5;
  if (strncmp(month, "Jun", 3) == 0) return 6;
  if (strncmp(month, "Jul", 3) == 0) return 7;
  if (strncmp(month, "Aug", 3) == 0) return 8;
  if (strncmp(month, "Sep", 3) == 0) return 9;
  if (strncmp(month, "Oct", 3) == 0) return 10;
  if (strncmp(month, "Nov", 3) == 0) return 11;
  if (strncmp(month, "Dec", 3) == 0) return 12;
  return 0;
}

int64_t daysFromCivil(int year, unsigned month, unsigned day) {
  year -= month <= 2;
  const int64_t era = (year >= 0 ? year : year - 399) / 400;
  const unsigned yoe = static_cast<unsigned>(year - era * 400);
  const unsigned doy = (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1;
  const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return era * 146097 + static_cast<int64_t>(doe) - 719468;
}

bool civilToEpoch(int year, int month, int day, int hour, int minute, int second, int tzOffsetSeconds, time_t& epoch) {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  int64_t days = daysFromCivil(year, static_cast<unsigned>(month), static_cast<unsigned>(day));
  int64_t totalSeconds = days * 86400LL + hour * 3600LL + minute * 60LL + second + tzOffsetSeconds;
  epoch = static_cast<time_t>(totalSeconds);
  return true;
}

String epochToTimestamp(time_t epoch) {
  struct tm tmTime;
  gmtime_r(&epoch, &tmTime);
  char buffer[20];
  snprintf(buffer, sizeof(buffer), "%04d-%02d-%02d %02d:%02d:%02d",
           tmTime.tm_year + 1900,
           tmTime.tm_mon + 1,
           tmTime.tm_mday,
           tmTime.tm_hour,
           tmTime.tm_min,
           tmTime.tm_sec);
  return String(buffer);
}

time_t compileTimeEpoch() {
  const char* date = __DATE__;
  const char* timeStr = __TIME__;
  char monthStr[4];
  monthStr[0] = date[0];
  monthStr[1] = date[1];
  monthStr[2] = date[2];
  monthStr[3] = '\0';

  int month = monthStringToNumber(monthStr);
  if (month == 0) {
    return 0;
  }

  int day = atoi(date + 4);
  int year = atoi(date + 7);
  int hour = atoi(timeStr);
  int minute = atoi(timeStr + 3);
  int second = atoi(timeStr + 6);

  time_t epoch;
  if (!civilToEpoch(year, month, day, hour, minute, second, 0, epoch)) {
    return 0;
  }
  return epoch;
}

bool ensureDataFileInitialized() {
  if (SD.exists(sdDataFilePath)) {
    return true;
  }

  File dataFile = SD.open(sdDataFilePath, FILE_WRITE);
  if (!dataFile) {
    Serial.println("❌ Failed to create SD data file");
    return false;
  }

  dataFile.print("[]");
  dataFile.close();
  return true;
}

bool initSDCard() {
  Serial.println("💾 Initializing SD card...");
  SPI.begin(sdSckPin, sdMisoPin, sdMosiPin, sdCsPin);

  if (!SD.begin(sdCsPin, SPI, 8000000)) {
    Serial.println("⚠️ SD card initialization failed - continuing without offline storage");
    return false;
  }

  if (!ensureDataFileInitialized()) {
    Serial.println("⚠️ Could not prepare SD data file");
    return false;
  }

  Serial.println("✅ SD card ready for offline storage");
  return true;
}

bool appendMeasurementToSD(const Measurement& measurement) {
  if (!sdAvailable) {
    return false;
  }

  File dataFile = SD.open(sdDataFilePath, FILE_WRITE);
  if (!dataFile) {
    Serial.println("❌ Failed to open SD data file for append");
    return false;
  }

  size_t size = dataFile.size();
  if (size == 0) {
    dataFile.print("[]");
    size = 2;
  }

  if (size < 1 || !dataFile.seek(size - 1)) {
    Serial.println("❌ Failed to position within SD data file");
    dataFile.close();
    return false;
  }

  bool firstEntry = size <= 2;
  if (firstEntry) {
    dataFile.print("\n");
  } else {
    dataFile.print(",\n");
  }

  dataFile.print("  {\"timestamp\":\"");
  dataFile.print(measurement.timestamp);
  dataFile.print("\"");
  dataFile.print(",\"lat\":");
  dataFile.print(measurement.lat, 6);
  dataFile.print(",\"lon\":");
  dataFile.print(measurement.lon, 6);
  dataFile.print(",\"lux\":");
  dataFile.print(measurement.lux, 2);
  dataFile.print(",\"gpsFix\":");
  dataFile.print(measurement.gpsFix ? "true" : "false");
  dataFile.print("}\n]");

  dataFile.close();
  return true;
}

String getCurrentTimestamp() {
  time_t epoch;
  if (gps.date.isValid() && gps.time.isValid() &&
      civilToEpoch(gps.date.year(), gps.date.month(), gps.date.day(),
                   gps.time.hour(), gps.time.minute(), gps.time.second(),
                   TIMEZONE_OFFSET_SECONDS, epoch)) {
    lastKnownEpoch = epoch;
    lastEpochSyncMillis = millis();
    lastKnownTimestamp = epochToTimestamp(epoch);
    return lastKnownTimestamp;
  }

  if (lastKnownEpoch > 0) {
    unsigned long elapsedSeconds = (millis() - lastEpochSyncMillis) / 1000UL;
    if (elapsedSeconds > 0) {
      lastKnownEpoch += elapsedSeconds;
      lastEpochSyncMillis += elapsedSeconds * 1000UL;
    }
    lastKnownTimestamp = epochToTimestamp(lastKnownEpoch);
    return lastKnownTimestamp;
  }

  return String("1970-01-01 08:00:00");
}

bool syncTimeFromNTP(uint8_t maxAttempts = 10) {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov", "time.google.com");
  for (uint8_t attempt = 0; attempt < maxAttempts; ++attempt) {
    time_t now = time(nullptr);
    if (now > 100000) {
      time_t localEpoch = now + TIMEZONE_OFFSET_SECONDS;
      lastKnownEpoch = localEpoch;
      lastEpochSyncMillis = millis();
      lastKnownTimestamp = epochToTimestamp(localEpoch);
      Serial.println("🕒 Clock synced from NTP: " + lastKnownTimestamp);
      return true;
    }
    delay(500);
  }
  Serial.println("⚠️ NTP sync failed - falling back to GPS/RTC");
  return false;
}

const size_t MEASUREMENT_BATCH_SIZE = 5;
const size_t MEASUREMENT_BUFFER_CAPACITY = 50;
const unsigned long measurementInterval = 1000; // 1 second sampling
const unsigned long gpsMaxAgeMs = 15000; // Consider GPS stale after 15 seconds

Measurement measurementBuffer[MEASUREMENT_BUFFER_CAPACITY];
size_t measurementBufferStart = 0;
size_t measurementBufferCount = 0;
unsigned long lastMeasurementTime = 0;

#define LED_BUILTIN 2

void blinkCode(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(150);
    digitalWrite(LED_BUILTIN, LOW);
    delay(150);
  }
  delay(500);
}

bool connectWiFi(uint8_t maxAttempts = 3) {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  for (uint8_t attempt = 1; attempt <= maxAttempts; ++attempt) {
    Serial.println("📶 Attempting WiFi connection (" + String(attempt) + "/" + String(maxAttempts) + ")");
    WiFi.mode(WIFI_STA);
    WiFi.persistent(false);
    WiFi.disconnect();
    delay(100);
    WiFi.begin(ssid, password);

    unsigned long start = millis();
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
      delay(250);
      Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("✅ WiFi connected - IP: " + WiFi.localIP().toString());
      blinkCode(1);
      return true;
    }

    Serial.println("❌ WiFi connection attempt failed");
    blinkCode(5);
    delay(1000);
  }

  Serial.println("🚫 Unable to connect to WiFi after retries");
  return false;
}

bool testServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Cannot test server - WiFi disconnected");
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, backendURL);
  http.setTimeout(5000);
  int code = http.GET();
  http.end();

  if (code > 0) {
    Serial.println("✅ Server reachable (HTTP " + String(code) + ")");
    return true;
  }
  Serial.println("❌ Server unreachable (" + HTTPClient::errorToString(code) + ")");
  blinkCode(5);
  return false;
}

bool postJSON(String payload) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, postURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  int code = http.POST(payload);
  http.end();

  if (code > 0) {
    Serial.println("✅ POST success: " + String(code));
    blinkCode(2);
    return true;
  }
  Serial.println("❌ POST failed: " + String(code));
  blinkCode(5);
  return false;
}

bool sendDeviceHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  // connect to device online url
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, deviceOnlineURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  // send device id and name
  String payload = "{\"device_id\": " + String(deviceId) + 
                  ", \"name\": \"" + String(deviceName) + "\"}";
  
  // send payload via http post
  int code = http.POST(payload);
  http.end();

  // check if response is successful
  if (code > 0) {
    Serial.println("💓 Heartbeat sent: " + String(code));
    return true;
  }
  
  // Handle specific error codes
  if (code == -1) {
    Serial.println("❌ Heartbeat failed with -1, restarting WiFi...");
    WiFi.disconnect();
    delay(1000);
    connectWiFi();
    
    // Test server after WiFi restart
    if (testServer()) {
      Serial.println("✅ WiFi restarted and server reachable");
      return false; // Still return false since original heartbeat failed
    } else {
      Serial.println("❌ Server still unreachable after WiFi restart");
      return false;
    }
  }
  
  Serial.println("❌ Heartbeat failed: " + String(code));
  return false;
}

bool sendDeviceRestart() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  // connect to device restart url
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, deviceRestartURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  // send device id and name for restart notification
  String payload = "{\"device_id\": " + String(deviceId) + 
                  ", \"name\": \"" + String(deviceName) + "\"}";
  
  // send payload via http post
  int code = http.POST(payload);
  http.end();

  // check if response is successful
  if (code > 0) {
    Serial.println("🔄 Restart notification sent: " + String(code));
    return true;
  }
  Serial.println("❌ Restart notification failed: " + String(code));
  return false;
}


void pollGPS() {
  bool updated = false;

  while (ss.available() > 0) {
    if (gps.encode(ss.read())) {
      if (gps.location.isValid()) {
        currentLat = gps.location.lat();
        currentLon = gps.location.lng();
        updated = true;
      }
    }
  }

  if (gps.location.isValid()) {
    gpsAvailable = gps.location.age() <= gpsMaxAgeMs;
    if (gpsAvailable && !updated) {
      currentLat = gps.location.lat();
      currentLon = gps.location.lng();
    }
  } else {
    gpsAvailable = false;
  }
}

bool acquireInitialGPSFix(unsigned long timeoutMs) {
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    pollGPS();
    if (gpsAvailable) {
      Serial.println("📍 GPS Updated: " + String(currentLat, 6) + ", " + String(currentLon, 6));
      Serial.println("🛰️ Satellites: " + String(gps.satellites.value()) + ", HDOP: " + String(gps.hdop.hdop()));
      return true;
    }
    delay(50);
  }
  Serial.println("⚠️ GPS initial fix timed out");
  return false;
}

size_t bufferIndex(size_t offset) {
  return (measurementBufferStart + offset) % MEASUREMENT_BUFFER_CAPACITY;
}

bool enqueueMeasurement(const Measurement& measurement) {
  if (measurementBufferCount >= MEASUREMENT_BUFFER_CAPACITY) {
    Serial.println("⚠️ Measurement buffer full, dropping oldest reading");
    bulkMode = true;
    measurementBufferStart = bufferIndex(1);
    measurementBufferCount = MEASUREMENT_BUFFER_CAPACITY - 1;
  }

  size_t index = bufferIndex(measurementBufferCount);
  measurementBuffer[index] = measurement;
  measurementBufferCount++;
  return true;
}

void removeMeasurements(size_t count) {
  if (count == 0 || measurementBufferCount == 0) {
    return;
  }
  if (count > measurementBufferCount) {
    count = measurementBufferCount;
  }
  measurementBufferStart = bufferIndex(count);
  measurementBufferCount -= count;
}

String buildBatchPayload(size_t batchSize) {
  String payload = "{\"device_id\":" + String(deviceId) + ",\"sensor\":\"" + String(sensor) + "\",\"readings\":[";

  for (size_t i = 0; i < batchSize; ++i) {
    const Measurement& m = measurementBuffer[bufferIndex(i)];
    payload += "{\"lat\":" + String(m.lat, 6) +
               ",\"lon\":" + String(m.lon, 6) +
               ",\"lux\":" + String(m.lux, 2) +
               ",\"timestamp\":\"" + m.timestamp + "\"" +
               ",\"gpsFix\":" + String(m.gpsFix ? "true" : "false") + "}";
    if (i < batchSize - 1) {
      payload += ",";
    }
  }

  payload += "]}";
  return payload;
}

bool uploadMeasurementBatch(bool forcePartial = false) {
  if (measurementBufferCount == 0) {
    return true;
  }

  size_t batchSize = forcePartial ? measurementBufferCount : min((size_t)MEASUREMENT_BATCH_SIZE, measurementBufferCount);
  if (!forcePartial && batchSize < MEASUREMENT_BATCH_SIZE) {
    return true; // Not enough data yet
  }

  String payload = buildBatchPayload(batchSize);
  Serial.println("📤 Uploading batch of " + String(batchSize) + " readings");
  bool success = postJSON(payload);

  if (success) {
    removeMeasurements(batchSize);
    Serial.println("✅ Batch upload success. Remaining buffered: " + String(measurementBufferCount));
  } else {
    Serial.println("❌ Batch upload failed");
  }

  return success;
}

void attemptUploadPendingData(bool forcePartial = false) {
  if (WiFi.status() != WL_CONNECTED || measurementBufferCount == 0) {
    return;
  }

  if (uploadMeasurementBatch(forcePartial)) {
    if (measurementBufferCount == 0) {
      bulkMode = false;
    }
  } else {
    bulkMode = true;
  }
}

void printGPSStatus() {
  Serial.println("=== GPS Status ===");
  Serial.println("Available: " + String(gpsAvailable ? "YES" : "NO"));
  Serial.println("Current Lat: " + String(currentLat, 6));
  Serial.println("Current Lon: " + String(currentLon, 6));
  
  if (gps.location.isValid()) {
    Serial.println("Satellites: " + String(gps.satellites.value()));
    Serial.println("HDOP: " + String(gps.hdop.hdop()));
    Serial.println("Age: " + String(gps.location.age()) + "ms");
  } else {
    Serial.println("GPS Location: INVALID");
  }
  Serial.println("=================");
}

bool checkMissionStatus(const char* url) {
  // check if wifi is connected
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  // connect to mission status url
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, url);
  http.setTimeout(3000);

  // send get request
  int code = http.GET();
  if (code == 200) {
    String response = http.getString();
    http.end();
    
    // parse simple true/false response
    response.trim();
    response.toLowerCase();
    return (response == "true" || response.indexOf("\"status\":true") > -1);
  }
  // end request
  http.end();
  return false;
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  time_t buildEpoch = compileTimeEpoch();
  if (buildEpoch > 0) {
    lastKnownEpoch = buildEpoch;
    lastEpochSyncMillis = millis();
    lastKnownTimestamp = epochToTimestamp(buildEpoch);
    Serial.println("🕒 Clock primed from build timestamp: " + lastKnownTimestamp);
  }

  Wire.begin();
  lightMeter.begin();
  Serial.println(F("BH1750 Test begin"));

  sdAvailable = initSDCard();

  if (!sdAvailable) {
    Serial.println("⚠️ Offline logging disabled - SD card not ready");
  }
  
  // Initialize GPS
  ss.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17 for ESP32
  Serial.println("📍 GPS Module initializing...");
  delay(1000);
  
  // Try to get initial GPS reading
  Serial.println("📍 Attempting initial GPS reading...");
  if (acquireInitialGPSFix(gpsTimeout)) {
    Serial.println("✅ GPS initialized successfully");
    printGPSStatus();
  } else {
    Serial.println("⚠️ GPS not available, using default coordinates");
    currentLat = defaultLat;
    currentLon = defaultLon;
    gpsAvailable = false;
  }

  // ensure WiFi connection before contacting backend
  if (!connectWiFi(5)) {
    Serial.println("⚠️ Proceeding without WiFi - device will retry in main loop");
  }

  if (WiFi.status() == WL_CONNECTED) {
    syncTimeFromNTP();
  }

  if (!testServer()) {
    delay(500);
    ESP.restart();
  }
  
  // Send device restart notification 
  // This will reset on_mission to false in database and register device as online
  if (sendDeviceRestart()) {
    Serial.println("🔄 Device restart registered - mission reset in database");
  } else {
    Serial.println("⚠️ Restart notification failed, sending regular heartbeat");
    sendDeviceHeartbeat();
  }
  
  // Device always starts in idle state - mission status controlled by database
  startMission = false;
  Serial.println("🔄 Device startup complete - waiting for mission command");
}

void loop() {
  unsigned long currentTime = millis();

  pollGPS();
  
  // Handle WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected");
    
    // If mission is active but no WiFi, enable bulk mode
    if (startMission && !bulkMode) {
      bulkMode = true;
      Serial.println("📦 Entering bulk mode - will store data offline");
    }
    
    // Try to reconnect (non-blocking)
    blinkCode(3);
    if (connectWiFi(5)) {
      syncTimeFromNTP();
    }
  }

  // Send device heartbeat every 30 seconds
  if (currentTime - lastHeartbeat >= heartbeatInterval && WiFi.status() == WL_CONNECTED) {
    if (sendDeviceHeartbeat()) {
      lastHeartbeat = currentTime;
    }
  }

  // Mission control checks every 2 seconds
  if (currentTime - lastMissionCheck >= missionCheckInterval) {
    lastMissionCheck = currentTime;
    
    if (!startMission) {
      // Check for start mission command
      if (checkMissionStatus(startMissionURL)) {
        startMission = true;
        Serial.println("🚀 Mission started!");
        blinkCode(3);
      }
    } else {
      // Check for stop mission command
      if (checkMissionStatus(stopMissionURL)) {
        startMission = false;
        bulkMode = false;  // Stop bulk mode when mission ends
        Serial.println("🛑 Mission stopped!");
        blinkCode(1);
      }
    }
  }

  // GPS status check every 60 seconds
  if (currentTime - lastGPSStatus >= gpsStatusInterval) {
    lastGPSStatus = currentTime;
    printGPSStatus();
  }

  // Determine if a new measurement should be captured
  bool measurementDue = startMission &&
                        (lastMeasurementTime == 0 || (currentTime - lastMeasurementTime) >= measurementInterval);

  if (measurementDue) {
    lastMeasurementTime = currentTime;

    float lux = lightMeter.readLightLevel();
    Measurement measurement;
    measurement.lat = gpsAvailable ? currentLat : defaultLat;
    measurement.lon = gpsAvailable ? currentLon : defaultLon;
    measurement.lux = lux;
  measurement.timestamp = getCurrentTimestamp();
    measurement.gpsFix = gpsAvailable;

    enqueueMeasurement(measurement);

    if (!appendMeasurementToSD(measurement)) {
      if (sdAvailable) {
        Serial.println("⚠️ Failed to persist measurement to SD");
      }
    }

    String gpsStatus = measurement.gpsFix ? "📍 GPS" : "📏 Default";
    Serial.println(
      "📊 Buffered reading #" + String(measurementBufferCount) +
      " - Lux: " + String(lux, 2) +
      " | 🕒 " + measurement.timestamp +
      " | " + gpsStatus + ": " + String(measurement.lat, 6) + ", " + String(measurement.lon, 6)
    );
  }

  // Attempt to upload when WiFi is available
  if (WiFi.status() == WL_CONNECTED && measurementBufferCount > 0) {
    if (measurementBufferCount >= MEASUREMENT_BATCH_SIZE) {
      attemptUploadPendingData(false);
    } else if (!startMission || bulkMode) {
      // Flush remaining data when mission stops or recovering from bulk mode
      attemptUploadPendingData(true);
    }
  }

  delay(10);
}
