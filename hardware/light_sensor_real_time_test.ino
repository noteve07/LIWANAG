#include <Wire.h>
#include <BH1750.h>
#include <WiFi.h>
#include <HTTPClient.h>

BH1750 lightMeter;

// WiFi credentials
const char* ssid = "PLDTHOMEFIBReU2Fh";
const char* password = "PLDTWIFI95WZm";

// Backend endpoint
const char* serverName = "https://liwanag-backend.onrender.com/api/v1/sensor-demo";

void setup() {
  Serial.begin(9600);

  // Initialize I2C
  Wire.begin();
  lightMeter.begin();
  Serial.println(F("BH1750 Test begin"));

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float lux = lightMeter.readLightLevel();

    // Dummy coords around Balanga (can be static or from GPS if you have one)
    float lat = 14.680123;
    float lon = 120.540456;

    // Prepare JSON payload
    String jsonPayload = "{\"lat\": " + String(lat, 6) +
                         ", \"lon\": " + String(lon, 6) +
                         ", \"lux\": " + String(lux, 2) + "}";

    Serial.println("📤 Sending data: " + jsonPayload);

    // Make HTTP POST
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("✅ Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("❌ Error in POST: " + String(httpResponseCode));
    }

    http.end();
  } else {
    Serial.println("⚠️ WiFi not connected");
  }

  delay(2000); // every 2 seconds
}
