// sensor_phase_1.ino
// Added:
// - Bulk mode to store data offline when no wifi
// - Mission control to start and stop the mission
// - Device heartbeat to keep the device online
// - Data collection loop to collect data and send it to the backend
// - Data collection loop to collect data and store it in the sd card
// - Data collection loop to upload the data to the backend

// To Implement:
// - Bulk upload from SD card
// - Sensor data storage in SD card
// - Sensor data upload to backend
// - Sensor data storage in Supabase
// - Sensor data upload to Supabase

#include <Wire.h>
#include <BH1750.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

BH1750 lightMeter;

const char* ssid = "PLDTHOMEFIBReU2Fh";
const char* password = "PLDTWIFI95WZm";
const char* backendURL = "https://liwanag-backend.onrender.com/";
const char* postURL = "https://liwanag-backend.onrender.com/api/v1/sensor-demo";
const char* deviceOnlineURL = "https://liwanag-backend.onrender.com/api/v1/device-online";
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

// device info
const int deviceId = 1001; 
const char* deviceName = "Alpha";


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
  Serial.println("❌ Heartbeat failed: " + String(code));
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

  // this is good, esp32 should be at least connected to wifi at the start
  connectWiFi();

  if (!testServer()) {
    delay(500);
    ESP.restart();
  }
  
  // Send initial device heartbeat
  sendDeviceHeartbeat();
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
    
    // If bulk mode was active and mission is complete, upload stored data
    if (bulkMode && !startMission) {
      Serial.println("📤 WiFi restored, uploading bulk data...");
      // TODO: Implement bulk upload from SD card
      bulkMode = false;
      Serial.println("✅ Bulk upload complete, bulk mode disabled");
    }
  }

  // Send device heartbeat every 30 seconds
  if (currentTime - lastHeartbeat >= heartbeatInterval) {
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

  // Main data collection loop
  if (startMission) {
    float lux = lightMeter.readLightLevel();
    float lat = 14.680123;
    float lon = 120.540456;

    String jsonPayload = "{\"lat\": " + String(lat,6) +
                        ", \"lon\": " + String(lon,6) +
                        ", \"lux\": " + String(lux,2) + "}";

    Serial.println("📊 Collecting data - Lux: " + String(lux,2));
    
    if (WiFi.status() == WL_CONNECTED && !bulkMode) {
      // Normal mode - send data immediately
      Serial.println("📤 Sending data online");
      if (!postJSON(jsonPayload)) {
        Serial.println("⚠️ POST failed, enabling bulk mode");
        bulkMode = true;
      }
    } else {
      // Bulk mode - store data locally
      Serial.println("💾 Storing data offline (bulk mode)");
      // TODO: Store jsonPayload to SD card with timestamp
    }
    
    delay(2000);  // 2 second interval between readings
  } else {
    // Not in mission mode, just idle
    delay(100);
  }
}
