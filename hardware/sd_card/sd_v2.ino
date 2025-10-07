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
const unsigned long gpsTimeout = 5000; // 5 seconds timeout for initial GPS reading
const unsigned long gpsMaxAgeMs = 15000;
float defaultLat = 0.000000;
float defaultLon = 0.000000;
float currentLat = defaultLat;
float currentLon = defaultLon;
bool gpsAvailable = false;

// Measurement timing
const unsigned long measurementInterval = 1000; // 1 second sampling
const unsigned long gpsStatusInterval = 60000;   // 60 seconds status print

unsigned long lastMeasurementTime = 0;
unsigned long lastGPSStatus = 0;
bool collecting = false;
bool gpsReady = false;
bool readyBlinkState = false;
unsigned long lastReadyBlink = 0;
const unsigned long readyBlinkInterval = 300;

// Button state tracking (for edge detection)
int lastStartButtonState = HIGH;
int lastStopButtonState = HIGH;

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
		Serial.println("❌ Failed to create SD data file");
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
	Serial.println("💾 Initializing SD card...");
	SPI.begin(sdSckPin, sdMisoPin, sdMosiPin, sdCsPin);

	if (!SD.begin(sdCsPin, SPI, 8000000)) {
		Serial.println("⚠️ SD card initialization failed - data will not be stored");
		return false;
	}

	if (!ensureDataFileInitialized()) {
		Serial.println("⚠️ Could not prepare SD data file");
		return false;
	}

	Serial.println("✅ SD card ready for logging");
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
			Serial.print("📍 Initial GPS: ");
			Serial.print(currentLat, 6);
			Serial.print(", ");
			Serial.println(currentLon, 6);
			Serial.print("🛰️ Satellites: ");
			Serial.print(gps.satellites.value());
			Serial.print(" HDOP: ");
			Serial.println(gps.hdop.hdop());
			return true;
		}
		delay(50);
	}
	Serial.println("⚠️ GPS initial fix timed out");
	return false;
}

void printGPSStatus() {
	Serial.println("=== GPS Status ===");
	Serial.println(String("Available: ") + (gpsAvailable ? "YES" : "NO"));
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
		if (!gpsReady) {
			Serial.println("⏳ Ignoring start - waiting for GPS fix");
		} else if (!collecting) {
			collecting = true;
			lastMeasurementTime = 0; // Force immediate measurement
			Serial.println("🚀 Logging started");
			blinkCode(2);
			readyBlinkState = false;
			digitalWrite(LED_BUILTIN, LOW);
			lastReadyBlink = millis();
		}
	}

	if (stopState == LOW && lastStopButtonState == HIGH) {
		if (collecting) {
			collecting = false;
			Serial.println("🛑 Logging stopped");
			blinkCode(1);
			lastReadyBlink = millis();
			readyBlinkState = false;
			digitalWrite(LED_BUILTIN, LOW);
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

	time_t buildEpoch = compileTimeEpoch();
	if (buildEpoch > 0) {
		lastKnownEpoch = buildEpoch;
		lastEpochSyncMillis = millis();
		lastKnownTimestamp = epochToTimestamp(buildEpoch);
		Serial.println("🕒 Clock primed from build timestamp: " + lastKnownTimestamp);
	}

	Wire.begin();
	lightMeter.begin();
	Serial.println(F("BH1750 ready"));

	sdAvailable = initSDCard();
	if (!sdAvailable) {
		Serial.println("⚠️ Offline storage disabled - insert SD card and reset if needed");
	}

	// Initialize GPS
	ss.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17 for ESP32
	Serial.println("📍 GPS module initializing...");
	delay(1000);

	Serial.println("📍 Attempting initial GPS reading...");
	while (!acquireInitialGPSFix(gpsTimeout)) {
		Serial.println("⚠️ GPS lock unavailable, retrying...");
	}
	Serial.println("✅ GPS initialized");
	printGPSStatus();
	gpsReady = true;
	lastReadyBlink = millis();
	readyBlinkState = false;
	digitalWrite(LED_BUILTIN, LOW);
	Serial.println("✨ GPS lock acquired - waiting for START button");

	Serial.println("🔄 Ready - press START button to begin logging");
}

void loop() {
	unsigned long currentTime = millis();

	pollGPS();
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
			Serial.println(
					String("💾 Saved - Lux: ") + String(lux, 2) +
					" | 🕒 " + measurement.timestamp +
				" | " + (measurement.gpsFix ? "📍 GPS" : "📏 Default") +
				": " + String(measurement.lat, 6) + ", " + String(measurement.lon, 6)
			);
		} else {
			Serial.println("⚠️ Failed to write measurement to SD card");
		}
	}

	delay(10);
}
