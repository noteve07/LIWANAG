#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "PLDTHOMEFIBReU2Fh";
const char* password = "PLDTWIFI95WZm";

#define LED 27   // LED pin

WebServer server(80);

void handleRoot() {
  String html = "<h1>ESP32 LED Control</h1>";
  html += "<p><a href=\"/on\"><button>Turn ON</button></a></p>";
  html += "<p><a href=\"/off\"><button>Turn OFF</button></a></p>";
  server.send(200, "text/html", html);
}

void handleOn() {
  digitalWrite(LED, HIGH);
  server.send(200, "text/html", "<p>LED is ON <a href=\"/\">Go Back</a></p>");
}

void handleOff() {
  digitalWrite(LED, LOW);
  server.send(200, "text/html", "<p>LED is OFF <a href=\"/\">Go Back</a></p>");
}

void setup() {
  Serial.begin(115200);
  pinMode(LED, OUTPUT);
  digitalWrite(LED, LOW);

  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP address: ");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/on", handleOn);
  server.on("/off", handleOff);

  server.begin();
}

void loop() {
  server.handleClient();
}
