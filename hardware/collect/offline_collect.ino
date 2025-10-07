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
#include <SPI.h>
#include <SD.h>

BH1750 lightMeter;
TinyGPSPlus gps;
HardwareSerial ss(2); // Use Serial2 for GPS module

const char *ssid = "PLDTHOMEFIBReU2Fh";
const char *password = "PLDTWIFI95WZm";
const char *backendURL = "https://liwanag-backend.onrender.com/";
const char *postURL = "https://liwanag-backend.onrender.com/api/v1/sensor-demo-batch";
const char *deviceOnlineURL = "https://liwanag-backend.onrender.com/api/v1/device-online";
const char *deviceRestartURL = "https://liwanag-backend.onrender.com/api/v1/device-restart";
const char *startMissionURL = "https://liwanag-backend.onrender.com/api/v1/start-mission?device_id=1001";
const char *stopMissionURL = "https://liwanag-backend.onrender.com/api/v1/stop-mission?device_id=1001";

// new variables
const char *sensor = "Alpha"; // this will be passed to JSON as sensor property

bool startMission = false; // this will be controlled from the web through api
bool bulkMode = false;     // if no wifi, sensor will still collect but store first in sd card

// timing variables for heartbeat and mission control
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000; // 30 seconds

unsigned long lastMissionCheck = 0;
const unsigned long missionCheckInterval = 2000; // 2 seconds

unsigned long lastGPSStatus = 0;
const unsigned long gpsStatusInterval = 60000; // 60 seconds - print GPS status

// device info
const int deviceId = 1001;
const char *deviceName = "Alpha";

// GPS configuration
const unsigned long gpsTimeout = 5000; // 5 seconds timeout for GPS reading
float defaultLat = 0.000000;           // Default coordinates (Manila area)
float defaultLon = 0.000000;
float currentLat = defaultLat;
float currentLon = defaultLon;
bool gpsAvailable = false;

struct Measurement
{
    float lat;
    float lon;
    float lux;
    unsigned long timestamp;
    bool gpsFix;
};

const size_t MEASUREMENT_BATCH_SIZE = 5;
const size_t MEASUREMENT_BUFFER_CAPACITY = 50;
const unsigned long measurementInterval = 1000; // 1 second sampling
const unsigned long gpsMaxAgeMs = 15000;        // Consider GPS stale after 15 seconds

// SD card configuration (SPI mode)
const int sdCSPin = 5;
const int sdSCKPin = 18;
const int sdMISOPin = 19;
const int sdMOSIPin = 23;
const char *dataFilename = "/alpha_data_1.json";
bool sdAvailable = false;

// Manual control buttons (optional)
const int startButtonPin = 32;
const int stopButtonPin = 33;
const unsigned long buttonDebounceMs = 75;
unsigned long lastButtonCheck = 0;
bool startButtonPrevState = HIGH;
bool stopButtonPrevState = HIGH;

Measurement measurementBuffer[MEASUREMENT_BUFFER_CAPACITY];
size_t measurementBufferStart = 0;
size_t measurementBufferCount = 0;
unsigned long lastMeasurementTime = 0;
unsigned long totalMeasurementsLogged = 0;

#define LED_BUILTIN 2

void blinkCode(int times)
{
    for (int i = 0; i < times; i++)
    {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(150);
        digitalWrite(LED_BUILTIN, LOW);
        delay(150);
    }
    delay(500);
}

bool initSDCard()
{
    if (sdAvailable)
    {
        return true;
    }

    SPI.begin(sdSCKPin, sdMISOPin, sdMOSIPin, sdCSPin);

    if (!SD.begin(sdCSPin, SPI, 8000000))
    {
        Serial.println("❌ SD card initialization failed");
        sdAvailable = false;
        return false;
    }

    sdAvailable = true;
    Serial.println("💾 SD card ready");

    if (!SD.exists(dataFilename))
    {
        File file = SD.open(dataFilename, FILE_WRITE);
        if (file)
        {
            file.print("[]");
            file.close();
            Serial.println("🆕 Created log file: " + String(dataFilename));
        }
        else
        {
            Serial.println("⚠️ Unable to create log file: " + String(dataFilename));
            sdAvailable = false;
            return false;
        }
    }

    File existing = SD.open(dataFilename, FILE_READ);
    if (existing)
    {
        if (existing.size() == 0)
        {
            existing.close();
            File initFile = SD.open(dataFilename, FILE_WRITE);
            if (initFile)
            {
                initFile.print("[]");
                initFile.close();
                Serial.println("🧹 Reset empty log file to JSON array envelope");
            }
            else
            {
                Serial.println("⚠️ Failed to initialize empty log file envelope");
                sdAvailable = false;
                return false;
            }
        }
        else
        {
            Serial.println("📄 Existing log size: " + String(existing.size()) + " bytes");
            existing.close();
        }
    }
    else
    {
        Serial.println("⚠️ Unable to inspect log file after creation");
    }

    return true;
}

bool appendMeasurementToSD(const Measurement &measurement)
{
    if (!sdAvailable && !initSDCard())
    {
        return false;
    }

    File dataFile = SD.open(dataFilename, FILE_WRITE);
    if (!dataFile)
    {
        Serial.println("❌ Failed to open SD log file for writing");
        sdAvailable = false;
        if (!initSDCard())
        {
            return false;
        }

        dataFile = SD.open(dataFilename, FILE_WRITE);
        if (!dataFile)
        {
            Serial.println("❌ Second attempt to open SD log file failed");
            return false;
        }
    }

    size_t fileSize = dataFile.size();
    if (fileSize < 2)
    {
        Serial.println("⚠️ Log file malformed, reinitializing");
        dataFile.close();
        SD.remove(dataFilename);
        sdAvailable = false;
        if (!initSDCard())
        {
            return false;
        }
        dataFile = SD.open(dataFilename, FILE_WRITE);
        if (!dataFile)
        {
            Serial.println("❌ Unable to reopen log file after reset");
            return false;
        }
        fileSize = dataFile.size();
    }

    if (!dataFile.seek(fileSize - 1))
    {
        Serial.println("❌ Failed to position write cursor in log file");
        dataFile.close();
        return false;
    }

    if (fileSize > 2)
    {
        dataFile.print(",\n");
    }
    else
    {
        dataFile.print("\n");
    }

    dataFile.print("{\"timestamp\":");
    dataFile.print(measurement.timestamp);
    dataFile.print(",\"device_id\":");
    dataFile.print(deviceId);
    dataFile.print(",\"sensor\":\"");
    dataFile.print(sensor);
    dataFile.print("\",\"lux\":");
    dataFile.print(measurement.lux, 2);
    dataFile.print(",\"lat\":");
    dataFile.print(measurement.lat, 6);
    dataFile.print(",\"lon\":");
    dataFile.print(measurement.lon, 6);
    dataFile.print(",\"gpsFix\":");
    dataFile.print(measurement.gpsFix ? "true" : "false");
    dataFile.print("}");
    dataFile.print("\n]");

    dataFile.flush();
    dataFile.close();
    totalMeasurementsLogged++;
    return true;
}

void updateMissionStateFromButtons()
{
    unsigned long now = millis();
    if (now - lastButtonCheck < buttonDebounceMs)
    {
        return;
    }

    lastButtonCheck = now;

    bool startState = digitalRead(startButtonPin);
    bool stopState = digitalRead(stopButtonPin);

    if (startButtonPrevState == HIGH && startState == LOW)
    {
        if (!startMission)
        {
            startMission = true;
            bulkMode = false;
            Serial.println("🚀 Logging resumed via START button");
            blinkCode(2);
        }
    }

    if (stopButtonPrevState == HIGH && stopState == LOW)
    {
        if (startMission)
        {
            startMission = false;
            bulkMode = false;
            Serial.println("🛑 Logging paused via STOP button");
            blinkCode(1);
        }
    }

    startButtonPrevState = startState;
    stopButtonPrevState = stopState;
}

const bool enableCloudSync = false;
bool connectWiFi(uint8_t maxAttempts = 3)
{
    if (WiFi.status() == WL_CONNECTED)
    {
        return true;
    }

    for (uint8_t attempt = 1; attempt <= maxAttempts; ++attempt)
    {
        Serial.println("📶 Attempting WiFi connection (" + String(attempt) + "/" + String(maxAttempts) + ")");
        WiFi.mode(WIFI_STA);
        WiFi.persistent(false);
        WiFi.disconnect();
        delay(100);
        WiFi.begin(ssid, password);

        unsigned long start = millis();
        Serial.print("Connecting to WiFi");
        while (WiFi.status() != WL_CONNECTED && millis() - start < 20000)
        {
            delay(250);
            Serial.print(".");
        }

        if (WiFi.status() == WL_CONNECTED)
        {
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

bool testServer()
{
    if (WiFi.status() != WL_CONNECTED)
    {
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

    if (code > 0)
    {
        Serial.println("✅ Server reachable (HTTP " + String(code) + ")");
        return true;
    }
    Serial.println("❌ Server unreachable (" + HTTPClient::errorToString(code) + ")");
    blinkCode(5);
    return false;
}

bool postJSON(String payload)
{
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    http.begin(client, postURL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000);

    int code = http.POST(payload);
    http.end();

    if (code > 0)
    {
        Serial.println("✅ POST success: " + String(code));
        blinkCode(2);
        return true;
    }
    Serial.println("❌ POST failed: " + String(code));
    blinkCode(5);
    return false;
}

bool sendDeviceHeartbeat()
{
    if (WiFi.status() != WL_CONNECTED)
    {
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
    if (code > 0)
    {
        Serial.println("💓 Heartbeat sent: " + String(code));
        return true;
    }

    // Handle specific error codes
    if (code == -1)
    {
        Serial.println("❌ Heartbeat failed with -1, restarting WiFi...");
        WiFi.disconnect();
        delay(1000);
        connectWiFi();

        // Test server after WiFi restart
        if (testServer())
        {
            Serial.println("✅ WiFi restarted and server reachable");
            return false; // Still return false since original heartbeat failed
        }
        else
        {
            Serial.println("❌ Server still unreachable after WiFi restart");
            return false;
        }
    }

    Serial.println("❌ Heartbeat failed: " + String(code));
    return false;
}

bool sendDeviceRestart()
{
    if (WiFi.status() != WL_CONNECTED)
    {
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
    if (code > 0)
    {
        Serial.println("🔄 Restart notification sent: " + String(code));
        return true;
    }
    Serial.println("❌ Restart notification failed: " + String(code));
    return false;
}

void pollGPS()
{
    bool updated = false;

    while (ss.available() > 0)
    {
        if (gps.encode(ss.read()))
        {
            if (gps.location.isValid())
            {
                currentLat = gps.location.lat();
                currentLon = gps.location.lng();
                updated = true;
            }
        }
    }

    if (gps.location.isValid())
    {
        gpsAvailable = gps.location.age() <= gpsMaxAgeMs;
        if (gpsAvailable && !updated)
        {
            currentLat = gps.location.lat();
            currentLon = gps.location.lng();
        }
    }
    else
    {
        gpsAvailable = false;
    }
}

bool acquireInitialGPSFix(unsigned long timeoutMs)
{
    unsigned long start = millis();
    while (millis() - start < timeoutMs)
    {
        pollGPS();
        if (gpsAvailable)
        {
            Serial.println("📍 GPS Updated: " + String(currentLat, 6) + ", " + String(currentLon, 6));
            Serial.println("🛰️ Satellites: " + String(gps.satellites.value()) + ", HDOP: " + String(gps.hdop.hdop()));
            return true;
        }
        delay(50);
    }
    Serial.println("⚠️ GPS initial fix timed out");
    return false;
}

size_t bufferIndex(size_t offset)
{
    return (measurementBufferStart + offset) % MEASUREMENT_BUFFER_CAPACITY;
}

bool enqueueMeasurement(const Measurement &measurement)
{
    if (measurementBufferCount >= MEASUREMENT_BUFFER_CAPACITY)
    {
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

void removeMeasurements(size_t count)
{
    if (count == 0 || measurementBufferCount == 0)
    {
        return;
    }
    if (count > measurementBufferCount)
    {
        count = measurementBufferCount;
    }
    measurementBufferStart = bufferIndex(count);
    measurementBufferCount -= count;
}

String buildBatchPayload(size_t batchSize)
{
    String payload = "{\"device_id\":" + String(deviceId) + ",\"sensor\":\"" + String(sensor) + "\",\"readings\":[";

    for (size_t i = 0; i < batchSize; ++i)
    {
        const Measurement &m = measurementBuffer[bufferIndex(i)];
        payload += "{\"lat\":" + String(m.lat, 6) +
                   ",\"lon\":" + String(m.lon, 6) +
                   ",\"lux\":" + String(m.lux, 2) +
                   ",\"timestamp\":" + String(m.timestamp) +
                   ",\"gpsFix\":" + String(m.gpsFix ? "true" : "false") + "}";
        if (i < batchSize - 1)
        {
            payload += ",";
        }
    }

    payload += "]}";
    return payload;
}

bool uploadMeasurementBatch(bool forcePartial = false)
{
    if (measurementBufferCount == 0)
    {
        return true;
    }

    size_t batchSize = forcePartial ? measurementBufferCount : min((size_t)MEASUREMENT_BATCH_SIZE, measurementBufferCount);
    if (!forcePartial && batchSize < MEASUREMENT_BATCH_SIZE)
    {
        return true; // Not enough data yet
    }

    String payload = buildBatchPayload(batchSize);
    Serial.println("📤 Uploading batch of " + String(batchSize) + " readings");
    bool success = postJSON(payload);

    if (success)
    {
        removeMeasurements(batchSize);
        Serial.println("✅ Batch upload success. Remaining buffered: " + String(measurementBufferCount));
    }
    else
    {
        Serial.println("❌ Batch upload failed");
    }

    return success;
}

void attemptUploadPendingData(bool forcePartial = false)
{
    if (!enableCloudSync)
    {
        return;
    }

    if (WiFi.status() != WL_CONNECTED || measurementBufferCount == 0)
    {
        return;
    }

    if (uploadMeasurementBatch(forcePartial))
    {
        if (measurementBufferCount == 0)
        {
            bulkMode = false;
        }
    }
    else
    {
        bulkMode = true;
    }
}

void printGPSStatus()
{
    Serial.println("=== GPS Status ===");
    Serial.println("Available: " + String(gpsAvailable ? "YES" : "NO"));
    Serial.println("Current Lat: " + String(currentLat, 6));
    Serial.println("Current Lon: " + String(currentLon, 6));

    if (gps.location.isValid())
    {
        Serial.println("Satellites: " + String(gps.satellites.value()));
        Serial.println("HDOP: " + String(gps.hdop.hdop()));
        Serial.println("Age: " + String(gps.location.age()) + "ms");
    }
    else
    {
        Serial.println("GPS Location: INVALID");
    }
    Serial.println("=================");
}

bool checkMissionStatus(const char *url)
{
    // check if wifi is connected
    if (WiFi.status() != WL_CONNECTED)
    {
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
    if (code == 200)
    {
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

void setup()
{
    Serial.begin(115200);
    pinMode(LED_BUILTIN, OUTPUT);
    pinMode(startButtonPin, INPUT_PULLUP);
    pinMode(stopButtonPin, INPUT_PULLUP);
    startButtonPrevState = digitalRead(startButtonPin);
    stopButtonPrevState = digitalRead(stopButtonPin);
    Wire.begin();
    lightMeter.begin();
    Serial.println(F("BH1750 Test begin"));

    if (initSDCard())
    {
        Serial.println("📂 Logging to: " + String(dataFilename));
    }
    else
    {
        Serial.println("🚫 SD logging unavailable - verify wiring and card");
    }

    // Initialize GPS
    ss.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17 for ESP32
    Serial.println("📍 GPS Module initializing...");
    delay(1000);

    // Try to get initial GPS reading
    Serial.println("📍 Attempting initial GPS reading...");
    if (acquireInitialGPSFix(gpsTimeout))
    {
        Serial.println("✅ GPS initialized successfully");
        printGPSStatus();
    }
    else
    {
        Serial.println("⚠️ GPS not available, using default coordinates");
        currentLat = defaultLat;
        currentLon = defaultLon;
        gpsAvailable = false;
    }

    if (enableCloudSync)
    {
        if (!connectWiFi(5))
        {
            Serial.println("⚠️ Proceeding without WiFi - device will retry in main loop");
        }

        if (!testServer())
        {
            delay(500);
            ESP.restart();
        }

        if (sendDeviceRestart())
        {
            Serial.println("🔄 Device restart registered - mission reset in database");
        }
        else
        {
            Serial.println("⚠️ Restart notification failed, sending regular heartbeat");
            sendDeviceHeartbeat();
        }

        startMission = false;
        Serial.println("🔄 Device startup complete - waiting for mission command from backend");
    }
    else
    {
        startMission = true;
        if (stopButtonPrevState == LOW)
        {
            startMission = false;
            Serial.println("� Logging paused - STOP button held during boot");
        }
        Serial.println("📡 Cloud sync disabled - offline logging mode");
        Serial.println("▶️ Automatic data capture active");
    }
}

void loop()
{
    unsigned long currentTime = millis();

    pollGPS();
    updateMissionStateFromButtons();

    if (enableCloudSync)
    {
        if (WiFi.status() != WL_CONNECTED)
        {
            Serial.println("⚠️ WiFi disconnected");

            if (startMission && !bulkMode)
            {
                bulkMode = true;
                Serial.println("📦 Entering bulk mode - will store data offline");
            }

            blinkCode(3);
            connectWiFi(5);
        }

        if (currentTime - lastHeartbeat >= heartbeatInterval && WiFi.status() == WL_CONNECTED)
        {
            if (sendDeviceHeartbeat())
            {
                lastHeartbeat = currentTime;
            }
        }

        if (currentTime - lastMissionCheck >= missionCheckInterval)
        {
            lastMissionCheck = currentTime;

            if (!startMission)
            {
                if (checkMissionStatus(startMissionURL))
                {
                    startMission = true;
                    Serial.println("🚀 Mission started!");
                    blinkCode(3);
                }
            }
            else
            {
                if (checkMissionStatus(stopMissionURL))
                {
                    startMission = false;
                    bulkMode = false;
                    Serial.println("🛑 Mission stopped!");
                    blinkCode(1);
                }
            }
        }
    }

    // GPS status check every 60 seconds
    if (currentTime - lastGPSStatus >= gpsStatusInterval)
    {
        lastGPSStatus = currentTime;
        printGPSStatus();
    }

    // Determine if a new measurement should be captured
    bool measurementDue = startMission &&
                          (lastMeasurementTime == 0 || (currentTime - lastMeasurementTime) >= measurementInterval);

    if (measurementDue)
    {
        lastMeasurementTime = currentTime;

        float lux = lightMeter.readLightLevel();
        Measurement measurement;
        measurement.lat = gpsAvailable ? currentLat : defaultLat;
        measurement.lon = gpsAvailable ? currentLon : defaultLon;
        measurement.lux = lux;
        measurement.timestamp = currentTime;
        measurement.gpsFix = gpsAvailable;

        enqueueMeasurement(measurement);

        if (appendMeasurementToSD(measurement))
        {
            Serial.println(
                "💾 Logged reading #" + String(totalMeasurementsLogged) +
                " to SD - Lux: " + String(measurement.lux, 2) +
                " | " + (measurement.gpsFix ? "GPS" : "Default") +
                " " + String(measurement.lat, 6) + ", " + String(measurement.lon, 6));
        }
        else
        {
            Serial.println("❌ Failed to persist reading to SD card");
        }

        String gpsStatus = measurement.gpsFix ? "📍 GPS" : "📏 Default";
        Serial.println(
            "📊 Buffered reading #" + String(measurementBufferCount) +
            " - Lux: " + String(lux, 2) +
            " | " + gpsStatus + ": " + String(measurement.lat, 6) + ", " + String(measurement.lon, 6));
    }

    if (enableCloudSync && WiFi.status() == WL_CONNECTED && measurementBufferCount > 0)
    {
        if (measurementBufferCount >= MEASUREMENT_BATCH_SIZE)
        {
            attemptUploadPendingData(false);
        }
        else if (!startMission || bulkMode)
        {
            // Flush remaining data when mission stops or recovering from bulk mode
            attemptUploadPendingData(true);
        }
    }

    delay(10);
}
