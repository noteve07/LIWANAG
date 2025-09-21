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

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  Wire.begin();
  lightMeter.begin();
  Serial.println(F("BH1750 Test begin"));

  connectWiFi();

  if (!testServer()) {
    delay(500);
    ESP.restart();
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected, reconnecting...");
    blinkCode(5);
    connectWiFi();
    if (!testServer()) {
      delay(500);
      ESP.restart();
    }
  }

  float lux = lightMeter.readLightLevel();
  float lat = 14.680123;
  float lon = 120.540456;

  String jsonPayload = "{\"lat\": " + String(lat,6) +
                       ", \"lon\": " + String(lon,6) +
                       ", \"lux\": " + String(lux,2) + "}";

  Serial.println("📤 Sending payload");
  if (!postJSON(jsonPayload)) {
    Serial.println("⚠️ POST failed, restarting...");
    delay(500);
    ESP.restart();
  }

  delay(2000);
}
