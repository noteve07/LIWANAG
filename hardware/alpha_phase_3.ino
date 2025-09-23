// sensor_phase_3.ino
// Features:
// - GPS sensor integration (lat/lon)
// - Light sensor (lux)
// - Micro SD card for offline data storage
// - Bulk data upload when WiFi restored
// - Mission control system

#include <Wire.h>
#include <BH1750.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <SD.h>
#include <SPI.h>

BH1750 lightMeter;
TinyGPSPlus gps;
HardwareSerial ss(2); // Use Serial2 for GPS module
File dataFile;

const char* ssid = "PLDTHOMEFIBReU2Fh";
const char* password = "PLDTWIFI95WZm";
const char* backendURL = "https://liwanag-backend.onrender.com/";
const char* postURL = "https://liwanag-backend.onrender.com/api/v1/sensor-demo";
const char* bulkDataURL = "https://liwanag-backend.onrender.com/api/v1/bulk-data";
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

// SD Card configuration
const int chipSelect = 5; // CS pin for SD card (adjust based on your wiring)
const char* dataFileName = "/sensor_data.txt";
bool sdCardAvailable = false;
int offlineDataCount = 0;

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

void connectWiFi() {
  WiFi.disconnect();
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅ WiFi connected");
    blinkCode(1);
  } else {
    Serial.println("❌ WiFi connection failed");
    blinkCode(5);
    ESP.restart();
  }
}

bool testServer() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, backendURL);
  http.setTimeout(5000);
  int code = http.GET();
  http.end();

  if (code > 0) {
    Serial.println("✅ Server reachable");
    return true;
  }
  Serial.println("❌ Server unreachable");
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


bool readGPS() {
  // Read GPS data for specified timeout period
  unsigned long start = millis();
  bool newData = false;
  
  while (millis() - start < gpsTimeout) {
    while (ss.available() > 0) {
      if (gps.encode(ss.read())) {
        newData = true;
      }
    }
    
    if (newData && gps.location.isValid()) {
      currentLat = gps.location.lat();
      currentLon = gps.location.lng();
      gpsAvailable = true;
      
      Serial.println("📍 GPS Updated: " + String(currentLat, 6) + ", " + String(currentLon, 6));
      Serial.println("🛰️ Satellites: " + String(gps.satellites.value()) + ", HDOP: " + String(gps.hdop.hdop()));
      return true;
    }
    
    delay(10); // Small delay to prevent busy waiting
  }
  
  // GPS read timeout or invalid data
  if (newData) {
    Serial.println("⚠️ GPS data received but invalid location");
  } else {
    Serial.println("⚠️ No GPS data received");
  }
  
  gpsAvailable = false;
  return false;
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

bool initializeSDCard() {
  Serial.println("📄 Initializing SD Card...");
  
  if (!SD.begin(chipSelect)) {
    Serial.println("❌ SD Card initialization failed!");
    sdCardAvailable = false;
    return false;
  }
  
  Serial.println("✅ SD Card initialized successfully!");
  sdCardAvailable = true;
  
  // Check if data file exists, create if not
  if (!SD.exists(dataFileName)) {
    dataFile = SD.open(dataFileName, FILE_WRITE);
    if (dataFile) {
      dataFile.println("lat,lon,lux,sensor,timestamp");
      dataFile.close();
      Serial.println("📄 Data file created with headers");
    } else {
      Serial.println("❌ Failed to create data file");
      sdCardAvailable = false;
      return false;
    }
  } else {
    Serial.println("📄 Data file already exists");
  }
  
  return true;
}

bool writeDataToSD(float lat, float lon, float lux, const char* sensor) {
  if (!sdCardAvailable) {
    return false;
  }
  
  dataFile = SD.open(dataFileName, FILE_WRITE);
  if (dataFile) {
    String dataString = String(lat, 6) + "," + String(lon, 6) + "," + 
                       String(lux, 2) + "," + String(sensor) + "," + 
                       String(millis());
    
    dataFile.println(dataString);
    dataFile.close();
    offlineDataCount++;
    
    Serial.println("💾 Data saved to SD: " + dataString);
    Serial.println("📊 Total offline records: " + String(offlineDataCount));
    return true;
  } else {
    Serial.println("❌ Failed to open data file for writing");
    return false;
  }
}

String readBulkDataFromSD() {
  if (!sdCardAvailable || !SD.exists(dataFileName)) {
    return "";
  }
  
  dataFile = SD.open(dataFileName, FILE_READ);
  if (!dataFile) {
    Serial.println("❌ Failed to open data file for reading");
    return "";
  }
  
  String bulkData = "[";
  String line;
  bool firstRecord = true;
  bool skipHeader = true;
  
  while (dataFile.available()) {
    line = dataFile.readStringUntil('\n');
    line.trim();
    
    // Skip header line
    if (skipHeader) {
      skipHeader = false;
      continue;
    }
    
    if (line.length() > 0) {
      // Parse CSV line: lat,lon,lux,sensor,timestamp
      int firstComma = line.indexOf(',');
      int secondComma = line.indexOf(',', firstComma + 1);
      int thirdComma = line.indexOf(',', secondComma + 1);
      int fourthComma = line.indexOf(',', thirdComma + 1);
      
      if (firstComma > 0 && secondComma > 0 && thirdComma > 0 && fourthComma > 0) {
        String lat = line.substring(0, firstComma);
        String lon = line.substring(firstComma + 1, secondComma);
        String lux = line.substring(secondComma + 1, thirdComma);
        String sensor = line.substring(thirdComma + 1, fourthComma);
        
        if (!firstRecord) {
          bulkData += ",";
        }
        
        bulkData += "{\"lat\":" + lat + ",\"lon\":" + lon + 
                   ",\"lux\":" + lux + ",\"sensor\":\"" + sensor + "\"}";
        firstRecord = false;
      }
    }
  }
  
  bulkData += "]";
  dataFile.close();
  
  Serial.println("📤 Bulk data prepared: " + String(bulkData.length()) + " characters");
  return bulkData;
}

bool clearSDCardData() {
  if (!sdCardAvailable) {
    return false;
  }
  
  // Remove the file and recreate it with headers
  SD.remove(dataFileName);
  
  dataFile = SD.open(dataFileName, FILE_WRITE);
  if (dataFile) {
    dataFile.println("lat,lon,lux,sensor,timestamp");
    dataFile.close();
    offlineDataCount = 0;
    Serial.println("🗑️ SD Card data cleared, file recreated");
    return true;
  } else {
    Serial.println("❌ Failed to recreate data file after clearing");
    return false;
  }
}

bool postBulkData(String bulkDataJson) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  http.begin(client, bulkDataURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(30000); // 30 second timeout for bulk upload
  
  String payload = "{\"device_id\":" + String(deviceId) + ",\"data\":" + bulkDataJson + "}";
  
  Serial.println("📤 Uploading bulk data...");
  int code = http.POST(payload);
  http.end();
  
  if (code > 0) {
    Serial.println("✅ Bulk upload success: " + String(code));
    blinkCode(4); // 4 blinks for bulk upload success
    return true;
  }
  
  Serial.println("❌ Bulk upload failed: " + String(code));
  return false;
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
  Wire.begin();
  lightMeter.begin();
  Serial.println(F("BH1750 Test begin"));
  
  // Initialize GPS
  ss.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17 for ESP32
  Serial.println("📍 GPS Module initializing...");
  delay(1000);
  
  // Try to get initial GPS reading
  Serial.println("📍 Attempting initial GPS reading...");
  if (readGPS()) {
    Serial.println("✅ GPS initialized successfully");
    printGPSStatus();
  } else {
    Serial.println("⚠️ GPS not available, using default coordinates");
    currentLat = defaultLat;
    currentLon = defaultLon;
    gpsAvailable = false;
  }
  
  // Initialize SD Card
  if (initializeSDCard()) {
    Serial.println("✅ SD Card ready for offline data storage");
  } else {
    Serial.println("⚠️ SD Card not available, bulk mode disabled");
  }

  // this is good, esp32 should be at least connected to wifi at the start
  connectWiFi();

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
    connectWiFi();
  } else {
    // WiFi is connected
    
    // If bulk mode was active, try to upload stored data
    if (bulkMode && offlineDataCount > 0) {
      Serial.println("📤 WiFi restored, uploading bulk data...");
      String bulkDataJson = readBulkDataFromSD();
      
      if (bulkDataJson.length() > 2) { // More than just "[]"
        if (postBulkData(bulkDataJson)) {
          // Successfully uploaded, clear SD card data
          clearSDCardData();
          Serial.println("✅ Bulk upload complete, SD card cleared");
        } else {
          Serial.println("❌ Bulk upload failed, data kept on SD card");
        }
      }
      
      // Disable bulk mode since WiFi is restored
      bulkMode = false;
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

  // Main data collection loop
  if (startMission) {
    float lux = lightMeter.readLightLevel();
    // Try to get fresh GPS reading
    readGPS();
    
    // Use current GPS coordinates (either fresh or cached)
    float lat = currentLat;
    float lon = currentLon;

    String jsonPayload = "{\"lat\": " + String(lat,6) +
                        ", \"lon\": " + String(lon,6) +
                        ", \"lux\": " + String(lux,2) + "}";

    String gpsStatus = gpsAvailable ? "📍 GPS" : "📏 Default";
    Serial.println("📊 Collecting data - Lux: " + String(lux,2) + " | " + gpsStatus + ": " + String(lat,6) + ", " + String(lon,6));
    
    if (WiFi.status() == WL_CONNECTED && !bulkMode) {
      // Normal mode - send data immediately
      Serial.println("📤 Sending data online");
      if (!postJSON(jsonPayload)) {
        Serial.println("⚠️ POST failed, enabling bulk mode");
        bulkMode = true;
        // Also save this data point to SD card since upload failed
        if (sdCardAvailable) {
          writeDataToSD(lat, lon, lux, sensor);
        }
      }
    } else {
      // Bulk mode - store data locally
      Serial.println("💾 Storing data offline (bulk mode)");
      if (sdCardAvailable) {
        writeDataToSD(lat, lon, lux, sensor);
      } else {
        Serial.println("❌ SD Card not available, data lost!");
        blinkCode(5); // 5 blinks for error
      }
    }
    
    delay(500);  // 0.5 second interval between readings
  } else {
    // Not in mission mode, just idle
    delay(100);
  }
}
