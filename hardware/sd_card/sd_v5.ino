#include <Wire.h>
#include <BH1750.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <FS.h>
#include <SD.h>
#include <SPI.h>
#include <time.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 32
#define OLED_RESET    -1
#define I2C_SDA 21
#define I2C_SCL 22

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool displayAvailable = false;
bool displayDirty = true;

BH1750 lightMeter;
TinyGPSPlus gps;
HardwareSerial ss(2); // Serial2 for GPS module on ESP32

// SD card wiring (VSPI)
const int sdCsPin = 5;                 // CS wired to GPIO5
const int sdMisoPin = 19;              // MISO wired to GPIO19
const int sdMosiPin = 23;              // MOSI wired to GPIO23
const int sdSckPin = 18;               // SCK wired to GPIO18
const char* sdDataFilePath = "/sd_alpha_1.json";
bool sdAvailable = false;

const int TIMEZONE_OFFSET_SECONDS = 8 * 3600; // UTC+08

// Buttons
const int startButtonPin = 33;         // Start logging button
const int stopButtonPin = 32;          // Stop logging button

// LED feedback
#define LED_BUILTIN 2

// GPS configuration
const unsigned long gpsInitialAttemptMs = 15000; // 15 seconds for initial attempt
const unsigned long gpsMaxAgeMs = 15000;
float defaultLat = 0.000000;
float defaultLon = 0.000000;
float currentLat = defaultLat;
float currentLon = defaultLon;
bool gpsAvailable = false;
bool gpsEverFixed = false;

// Measurement timing
const unsigned long measurementInterval = 1000; // 1 second sampling
const unsigned long gpsStatusInterval = 60000;   // 60 seconds status print
const unsigned long gpsSearchLogInterval = 15000; // Log every 15s while searching

unsigned long lastMeasurementTime = 0;
unsigned long lastGPSStatus = 0;
unsigned long lastGPSSearchLog = 0;
bool collecting = false;
bool gpsReady = false;
bool readyBlinkState = false;
unsigned long lastReadyBlink = 0;
const unsigned long readyBlinkInterval = 300;
bool hasMeasurement = false;
String debugLines[3] = {"", "", ""};

struct Measurement {
	float lat;
	float lon;
	float lux;
	String timestamp;
	bool gpsFix;
};

Measurement lastMeasurement;

// Button state tracking (for edge detection)
int lastStartButtonState = HIGH;
int lastStopButtonState = HIGH;

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

String sanitizeForDisplay(const String& text) {
	String result;
	result.reserve(text.length());
	for (size_t i = 0; i < text.length(); ++i) {
		char c = text.charAt(i);
		if (c >= 32 && c <= 126) {
			result += c;
		} else if (c == '\n') {
			result += ' ';
		}
	}
	return result;
}

void refreshDisplay();

void pushDebugLine(const String& line) {
	debugLines[0] = debugLines[1];
	debugLines[1] = debugLines[2];
	debugLines[2] = sanitizeForDisplay(line);
	displayDirty = true;
}

void logMessage(const String& message) {
	Serial.println(message);
	if (displayAvailable) {
		pushDebugLine(message);
		refreshDisplay();
	}
}

void logMessage(const __FlashStringHelper* message) {
	String temp(message);
	logMessage(temp);
}

void markDisplayDirty() {
	displayDirty = true;
}

void drawLoadingBar(int progress) {
	if (!displayAvailable) {
		return;
	}
	int barWidth = 100;
	int barHeight = 6;
	int x = (SCREEN_WIDTH - barWidth) / 2;
	int y = 22;
	display.drawRect(x, y, barWidth, barHeight, SSD1306_WHITE);
	int fillWidth = (barWidth - 2) * progress / 100;
	display.fillRect(x + 1, y + 1, fillWidth, barHeight - 2, SSD1306_WHITE);
}

void showLoadingScreen() {
	if (!displayAvailable) {
		return;
	}
	display.clearDisplay();
	display.setTextSize(2);
	display.setTextColor(SSD1306_WHITE);
	display.setCursor(20, 4);
	display.print("LIWANAG");
	display.display();

	for (int progress = 0; progress <= 100; progress += 10) {
		display.fillRect(0, 20, SCREEN_WIDTH, 12, SSD1306_BLACK);
		drawLoadingBar(progress);
		display.display();
		delay(250);
	}
}

void renderDebugScreen() {
	if (!displayAvailable) {
		return;
	}
	display.clearDisplay();
	display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
	display.setTextSize(1);
	display.setTextColor(SSD1306_WHITE);
	for (uint8_t i = 0; i < 3; ++i) {
		display.setCursor(4, 6 + (i * 9));
		display.print(debugLines[i]);
	}
	display.display();
}

void renderMeasurementScreen() {
	if (!displayAvailable || !hasMeasurement) {
		display.clearDisplay();
		display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
		display.setTextSize(1);
		display.setTextColor(SSD1306_WHITE);
		display.setCursor(10, 12);
		display.print("Waiting for data...");
		display.display();
		return;
	}
	display.clearDisplay();
	display.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
	display.setTextSize(1);
	display.setTextColor(SSD1306_WHITE);

	if (lastMeasurement.gpsFix) {
		display.fillCircle(122, 4, 3, SSD1306_WHITE);
	} else {
		display.drawCircle(122, 4, 3, SSD1306_WHITE);
	}

	display.setCursor(5, 6);
	display.print("LUX: ");
	display.setTextSize(2);
	display.print(lastMeasurement.lux, 0);

	display.setTextSize(1);
	display.setCursor(5, 24);
	if (lastMeasurement.gpsFix) {
		display.print(lastMeasurement.lat, 6);
		display.print(", ");
		display.print(lastMeasurement.lon, 6);
	} else {
		display.print("GPS: Searching...");
	}
	display.display();
}

void refreshDisplay() {
	if (!displayAvailable || !displayDirty) {
		return;
	}
	if (collecting) {
		renderMeasurementScreen();
	} else {
		renderDebugScreen();
	}
	displayDirty = false;
}

void initializeDisplay() {
	Wire.begin(I2C_SDA, I2C_SCL);
	if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
		displayAvailable = false;
		logMessage("OLED not found - continuing headless");
		return;
	}
	displayAvailable = true;
	display.clearDisplay();
	display.setTextSize(1);
	display.setTextColor(SSD1306_WHITE);
	showLoadingScreen();
	display.clearDisplay();
	display.display();
	logMessage("OLED ready");
}

void blinkCode(int times, int onMs = 150, int offMs = 150) {
	for (int i = 0; i < times; i++) {
		digitalWrite(LED_BUILTIN, HIGH);
		delay(onMs);
		digitalWrite(LED_BUILTIN, LOW);
		delay(offMs);
	}
}

bool ensureDataFileInitialized() {
	if (SD.exists(sdDataFilePath)) {
		return true;
	}

	File dataFile = SD.open(sdDataFilePath, FILE_WRITE);
	if (!dataFile) {
		logMessage("Failed to create SD data file");
		return false;
	}

	dataFile.print("[]");
	dataFile.close();
	return true;
}

String getCurrentTimestamp() {
	time_t epoch;
	if (gps.date.isValid() && gps.time.isValid() &&
		civilToEpoch(gps.date.year(), gps.date.month(), gps.date.day(),
					 gps.time.hour(), gps.time.minute(), gps.time.second(), TIMEZONE_OFFSET_SECONDS, epoch)) {
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

bool initSDCard() {
	logMessage("Initializing SD card...");
	SPI.begin(sdSckPin, sdMisoPin, sdMosiPin, sdCsPin);

	if (!SD.begin(sdCsPin, SPI, 8000000)) {
		logMessage("SD card init failed - data offline only");
		return false;
	}

	if (!ensureDataFileInitialized()) {
		logMessage("Could not prepare SD data file");
		return false;
	}

	logMessage("SD card ready for logging");
	return true;
}

bool appendMeasurementToSD(const Measurement& measurement) {
	if (!sdAvailable) {
		return false;
	}

	File dataFile = SD.open(sdDataFilePath, FILE_WRITE);
	if (!dataFile) {
		logMessage("Failed to open SD data file for append");
		return false;
	}

	size_t size = dataFile.size();
	if (size == 0) {
		dataFile.print("[]");
		size = 2;
	}

	if (size < 1 || !dataFile.seek(size - 1)) {
		logMessage("Failed to position within SD data file");
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
			logMessage("Initial GPS: " + String(currentLat, 6) + ", " + String(currentLon, 6));
			logMessage("Satellites: " + String(gps.satellites.value()) + " HDOP: " + String(gps.hdop.hdop()));
			return true;
		}
		delay(50);
	}
	return false;
}

void printGPSStatus() {
	logMessage("=== GPS Status ===");
	logMessage(String("Available: ") + (gpsAvailable ? "YES" : "NO"));
	logMessage("Current Lat: " + String(currentLat, 6));
	logMessage("Current Lon: " + String(currentLon, 6));
	if (gps.location.isValid()) {
		logMessage("Satellites: " + String(gps.satellites.value()));
		logMessage("HDOP: " + String(gps.hdop.hdop()));
		logMessage("Age: " + String(gps.location.age()) + "ms");
	} else {
		logMessage("GPS Location: INVALID");
	}
	logMessage("=================");
}

void updateReadyIndicator(unsigned long currentTime) {
	if (gpsReady && !collecting) {
		if (currentTime - lastReadyBlink >= readyBlinkInterval) {
			lastReadyBlink = currentTime;
			readyBlinkState = !readyBlinkState;
			digitalWrite(LED_BUILTIN, readyBlinkState ? HIGH : LOW);
		}
	} else {
		if (readyBlinkState) {
			readyBlinkState = false;
			digitalWrite(LED_BUILTIN, LOW);
		}
	}
}

void handleButtons() {
	int startState = digitalRead(startButtonPin);
	int stopState = digitalRead(stopButtonPin);

	if (startState == LOW && lastStartButtonState == HIGH) {
		if (!collecting) {
			collecting = true;
			lastMeasurementTime = 0; // Force immediate measurement
			logMessage(gpsAvailable ? "Logging started with GPS coordinates" : "Logging started with default coordinates");
			blinkCode(2);
			readyBlinkState = false;
			digitalWrite(LED_BUILTIN, LOW);
			lastReadyBlink = millis();
			hasMeasurement = false;
			displayDirty = true;
		}
	}

	if (stopState == LOW && lastStopButtonState == HIGH) {
		if (collecting) {
			collecting = false;
			logMessage("Logging stopped");
			blinkCode(1);
			lastReadyBlink = millis();
			readyBlinkState = false;
			digitalWrite(LED_BUILTIN, LOW);
			displayDirty = true;
		}
	}

	lastStartButtonState = startState;
	lastStopButtonState = stopState;
}

void setup() {
	Serial.begin(115200);
	pinMode(LED_BUILTIN, OUTPUT);
	pinMode(startButtonPin, INPUT_PULLUP);
	pinMode(stopButtonPin, INPUT_PULLUP);

	initializeDisplay();

	if (!displayAvailable) {
		Wire.begin(I2C_SDA, I2C_SCL);
	}

	time_t buildEpoch = compileTimeEpoch();
	if (buildEpoch > 0) {
		lastKnownEpoch = buildEpoch;
		lastEpochSyncMillis = millis();
		lastKnownTimestamp = epochToTimestamp(buildEpoch);
		logMessage("Clock primed from build timestamp: " + lastKnownTimestamp);
	}

	lightMeter.begin();
	logMessage(F("BH1750 ready"));

	sdAvailable = initSDCard();
	if (!sdAvailable) {
		logMessage("Offline storage disabled - insert SD card");
	}

	ss.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17 for ESP32
	logMessage("GPS module initializing...");
	delay(1000);

	logMessage("Attempting GPS lock (15s window)...");
	if (acquireInitialGPSFix(gpsInitialAttemptMs)) {
		gpsEverFixed = true;
		logMessage("GPS lock acquired");
		printGPSStatus();
	} else {
		logMessage("No GPS lock yet - using default coordinates");
		logMessage("We'll keep listening for GPS in the background");
	}

	gpsReady = true;
	lastReadyBlink = millis();
	readyBlinkState = false;
	digitalWrite(LED_BUILTIN, LOW);
	logMessage("Ready - press START to begin logging");
	refreshDisplay();
}

void loop() {
	unsigned long currentTime = millis();

	pollGPS();

	if (gpsAvailable && !gpsEverFixed) {
		logMessage("GPS fix obtained during operation");
		printGPSStatus();
		gpsEverFixed = true;
	}

	if (!gpsAvailable && (currentTime - lastGPSSearchLog >= gpsSearchLogInterval)) {
		lastGPSSearchLog = currentTime;
		logMessage("GPS searching...");
	}

	handleButtons();
	updateReadyIndicator(currentTime);

	if (currentTime - lastGPSStatus >= gpsStatusInterval) {
		lastGPSStatus = currentTime;
		printGPSStatus();
	}

	bool measurementDue = collecting &&
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

		if (appendMeasurementToSD(measurement)) {
			lastMeasurement = measurement;
			hasMeasurement = true;
			displayDirty = true;
			logMessage(
				String("LUX: ") + String(lux, 1) + " lx" +
				" | " + measurement.timestamp +
				(measurement.gpsFix ?
					" | GPS: " + String(measurement.lat, 6) + ", " + String(measurement.lon, 6) :
					" | GPS: No fix")
			);
		} else {
			logMessage("Failed to write measurement to SD card");
		}
	}

	refreshDisplay();
	delay(10);
}
