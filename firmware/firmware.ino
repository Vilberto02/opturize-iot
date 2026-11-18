/**
 * @file sketch.ino
 * @brief Firmware ESP32 - Proyecto OpTurize (SIT-Opt)
 * @details Monitoreo y control inteligente de aforo para lugares turísticos.
 *          UNMSM - FISI - E.P. Ingeniería de Software (2026).
 *          Curso: Internet de las Cosas.
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURACIÓN DE PINES (Laboratorio 03)
// ==========================================
#define PIN_TRIG_ENTRY   5     // HC-SR04 Entrada (Trigger)
#define PIN_ECHO_ENTRY   18    // HC-SR04 Entrada (Echo)
#define PIN_TRIG_EXIT    19    // HC-SR04 Salida (Trigger)
#define PIN_ECHO_EXIT    25    // HC-SR04 Salida (Echo)

#define PIN_DHT          4     // Sensor ambiental DHT22/DHT11
#define DHTTYPE          DHT22

#define PIN_LED_GREEN    12    // Semáforo: Aforo Libre
#define PIN_LED_YELLOW   14    // Semáforo: Aforo Moderado (Alerta)
#define PIN_LED_RED      27    // Semáforo: Aforo Completo (Lleno)

#define PIN_SERVO        13    // Talanquera / Barrera física (PWM)
#define PIN_BUZZER       23    // Alarma acústica

#define SCREEN_WIDTH     128
#define SCREEN_HEIGHT    64
#define OLED_RESET       -1
#define SCREEN_ADDRESS   0x3C

// ==========================================
// PARÁMETROS DEL SISTEMA
// ==========================================
const char* DEVICE_ID       = "ESP32-TURISMO-01";
const char* SPOT_NAME       = "Huaca Pucllana";
int maxCapacity             = 20;     // Capacidad máxima permisible
int warningThreshold        = 14;     // Umbral de alerta (70%)
int currentOccupancy        = 0;      // Conteo actual de visitantes

const float DETECTION_DISTANCE_CM = 80.0; // Distancia para registrar paso (< 80 cm)
const unsigned long COOLDOWN_MS   = 1200; // Tiempo entre detecciones consecutivas

// Variables de estado de sensores
bool entrySensorActive = false;
bool exitSensorActive  = false;
unsigned long lastEntryTime = 0;
unsigned long lastExitTime  = 0;

// Variables ambientales
float temperature = 22.0;
float humidity    = 70.0;
unsigned long lastDhtReadTime = 0;

// Estados del Semáforo / Sistema
enum TrafficState {
  STATE_FREE,       // Verde: Aforo libre
  STATE_MODERATE,   // Amarillo: Moderado
  STATE_FULL        // Rojo: Lleno / Acceso cerrado
};

TrafficState currentState = STATE_FREE;
TrafficState previousState = STATE_FREE;
bool barrierOpen = true;

// ==========================================
// RED & TELEMETRÍA (MQTT)
// ==========================================
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* TOPIC_PUB     = "opturize/turismo/ESP32-TURISMO-01/telemetria";
const char* TOPIC_SUB     = "opturize/turismo/ESP32-TURISMO-01/control";

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Instancias de hardware
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
DHT dht(PIN_DHT, DHTTYPE);
Servo barrierServo;

unsigned long lastTelemetryPublish = 0;
const unsigned long TELEMETRY_INTERVAL = 5000; // Publicar cada 5s

// ==========================================
// PROTOTIPOS DE FUNCIONES
// ==========================================
void setupWiFi();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
float readUltrasonicDistance(int trigPin, int echoPin);
void processEntrySensor();
void processExitSensor();
void updateTrafficState();
void updateActuators();
void updateDisplay();
void publishTelemetry();
void soundBeep(int frequency, int durationMs);
void soundAlarm();

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n==========================================");
  Serial.println("  OpTurize (SIT-Opt) - Firmware ESP32     ");
  Serial.println("  UNMSM - FISI - Internet de las Cosas    ");
  Serial.println("==========================================");

  // Inicialización de Pines
  pinMode(PIN_TRIG_ENTRY, OUTPUT);
  pinMode(PIN_ECHO_ENTRY, INPUT);
  pinMode(PIN_TRIG_EXIT, OUTPUT);
  pinMode(PIN_ECHO_EXIT, INPUT);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_TRIG_ENTRY, LOW);
  digitalWrite(PIN_TRIG_EXIT, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Inicialización Servomotor
  barrierServo.attach(PIN_SERVO);
  barrierServo.write(90); // Inicialmente abierta (90 grados)

  // Inicialización DHT
  dht.begin();

  // Inicialización Pantalla OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("[-] Error: No se detectó pantalla OLED SSD1306");
  } else {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(10, 15);
    display.println("OpTurize IoT UNMSM");
    display.setCursor(10, 30);
    display.println("Iniciando sistema...");
    display.display();
    delay(1000);
  }

  // Conexión WiFi & MQTT
  setupWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);

  updateTrafficState();
  updateActuators();
  updateDisplay();
  publishTelemetry();

  soundBeep(1200, 150); // Tono de inicio listo
  Serial.println("[+] Inicialización completa. Esperando detección de visitantes...\n");
}

// ==========================================
// LOOP PRINCIPAL
// ==========================================
void loop() {
  // Manejo de conexión MQTT
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // 1. Lectura de Sensores Ultrasónicos (Aforo)
  processEntrySensor();
  processExitSensor();

  // 2. Lectura periódica de Clima (DHT22)
  if (millis() - lastDhtReadTime > 3000) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t) && !isnan(h)) {
      temperature = t;
      humidity = h;
    }
    lastDhtReadTime = millis();
    updateDisplay();
  }

  // 3. Publicación periódica de telemetría por MQTT
  if (millis() - lastTelemetryPublish >= TELEMETRY_INTERVAL) {
    publishTelemetry();
    lastTelemetryPublish = millis();
  }

  delay(50); // Breve retardo para estabilidad
}

// ==========================================
// MEDICIÓN DE DISTANCIA ULTRASÓNICA
// ==========================================
float readUltrasonicDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // Timeout 30ms (~5 metros máx)
  if (duration == 0) {
    return 400.0; // Fuera de rango / sin eco
  }
  return (duration * 0.0343) / 2.0;
}

// ==========================================
// PROCESAMIENTO: SENSOR DE ENTRADA (A)
// ==========================================
void processEntrySensor() {
  float dist = readUltrasonicDistance(PIN_TRIG_ENTRY, PIN_ECHO_ENTRY);
  unsigned long now = millis();

  if (dist < DETECTION_DISTANCE_CM) {
    if (!entrySensorActive && (now - lastEntryTime > COOLDOWN_MS)) {
      entrySensorActive = true;
      lastEntryTime = now;

      if (currentOccupancy < maxCapacity) {
        currentOccupancy++;
        Serial.printf("[>> INGRESO] Persona detectada. Aforo actual: %d / %d (Dist: %.1f cm)\n", 
                      currentOccupancy, maxCapacity, dist);
        soundBeep(1800, 100);
        updateTrafficState();
        updateActuators();
        updateDisplay();
        publishTelemetry();
      } else {
        Serial.printf("[!! ALERTA] Intento de ingreso RECHAZADO: Aforo Lleno (%d / %d)\n", 
                      currentOccupancy, maxCapacity);
        soundAlarm();
      }
    }
  } else {
    entrySensorActive = false;
  }
}

// ==========================================
// PROCESAMIENTO: SENSOR DE SALIDA (B)
// ==========================================
void processExitSensor() {
  float dist = readUltrasonicDistance(PIN_TRIG_EXIT, PIN_ECHO_EXIT);
  unsigned long now = millis();

  if (dist < DETECTION_DISTANCE_CM) {
    if (!exitSensorActive && (now - lastExitTime > COOLDOWN_MS)) {
      exitSensorActive = true;
      lastExitTime = now;

      if (currentOccupancy > 0) {
        currentOccupancy--;
        Serial.printf("[<< SALIDA] Persona saliendo. Aforo actual: %d / %d (Dist: %.1f cm)\n", 
                      currentOccupancy, maxCapacity, dist);
        soundBeep(900, 100);
        updateTrafficState();
        updateActuators();
        updateDisplay();
        publishTelemetry();
      } else {
        Serial.println("[i] Salida detectada con aforo ya en 0.");
      }
    }
  } else {
    exitSensorActive = false;
  }
}

// ==========================================
// ACTUALIZACIÓN DE LA MÁQUINA DE ESTADOS
// ==========================================
void updateTrafficState() {
  previousState = currentState;

  if (currentOccupancy >= maxCapacity) {
    currentState = STATE_FULL;
  } else if (currentOccupancy >= warningThreshold) {
    currentState = STATE_MODERATE;
  } else {
    currentState = STATE_FREE;
  }

  // Notificar cambio de estado
  if (currentState != previousState) {
    Serial.print("[ESTADO] Transición a: ");
    if (currentState == STATE_FREE) Serial.println("LIBRE (Verde)");
    else if (currentState == STATE_MODERATE) Serial.println("MODERADO (Amarillo)");
    else if (currentState == STATE_FULL) Serial.println("LLENO (Rojo - Bloqueo)");
  }
}

// ==========================================
// CONTROL DE ACTUADORES FÍSICOS
// ==========================================
void updateActuators() {
  switch (currentState) {
    case STATE_FREE:
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_YELLOW, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      barrierServo.write(90); // Abierta
      barrierOpen = true;
      break;

    case STATE_MODERATE:
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_YELLOW, HIGH);
      digitalWrite(PIN_LED_RED, LOW);
      barrierServo.write(90); // Abierta pero con advertencia
      barrierOpen = true;
      break;

    case STATE_FULL:
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_YELLOW, LOW);
      digitalWrite(PIN_LED_RED, HIGH);
      barrierServo.write(0);  // Talanquera cerrada (bloqueo)
      barrierOpen = false;
      break;
  }
}

// ==========================================
// DESPLIEGUE VISUAL EN PANTALLA OLED SSD1306
// ==========================================
void updateDisplay() {
  display.clearDisplay();

  // Barra de Encabezado Superior
  display.fillRect(0, 0, SCREEN_WIDTH, 12, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(4, 2);
  display.print("OpTurize");
  display.setCursor(68, 2);
  display.print("UNMSM IoT");

  // Nombre del atractivo
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 16);
  display.print("Sitio: ");
  display.println(SPOT_NAME);

  // Conteo de Aforo destacado
  display.setCursor(0, 28);
  display.setTextSize(1);
  display.print("Aforo: ");
  display.setTextSize(2);
  display.printf("%2d/%d", currentOccupancy, maxCapacity);

  // Barra de progreso gráfica
  int barWidth = map(constrain(currentOccupancy, 0, maxCapacity), 0, maxCapacity, 0, 124);
  display.drawRect(2, 46, 124, 6, SSD1306_WHITE);
  display.fillRect(2, 46, barWidth, 6, SSD1306_WHITE);

  // Estado del Semáforo y Clima
  display.setTextSize(1);
  display.setCursor(2, 55);
  if (currentState == STATE_FREE) {
    display.print("[LIBRE] ");
  } else if (currentState == STATE_MODERATE) {
    display.print("[ALERTA]");
  } else {
    display.print("[LLENO] ");
  }

  display.setCursor(64, 55);
  display.printf("%.1fC %.0f%%", temperature, humidity);

  display.display();
}

// ==========================================
// SONIDOS DEL BUZZER
// ==========================================
void soundBeep(int frequency, int durationMs) {
  tone(PIN_BUZZER, frequency, durationMs);
}

void soundAlarm() {
  for (int i = 0; i < 3; i++) {
    tone(PIN_BUZZER, 2500, 120);
    delay(150);
  }
}

// ==========================================
// PUBLICACIÓN TELEMETRÍA MQTT (JSON)
// ==========================================
void publishTelemetry() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<300> doc;
  doc["id_dispositivo"]     = DEVICE_ID;
  doc["lugar_turistico"]    = SPOT_NAME;
  doc["aforo_actual"]       = currentOccupancy;
  doc["capacidad_maxima"]   = maxCapacity;
  doc["porcentaje_aforo"]   = (float)currentOccupancy / maxCapacity * 100.0;
  
  if (currentState == STATE_FREE) doc["estado_semaforo"] = "VERDE";
  else if (currentState == STATE_MODERATE) doc["estado_semaforo"] = "AMARILLO";
  else doc["estado_semaforo"] = "ROJO";

  doc["talanquera_abierta"] = barrierOpen;
  doc["temperatura"]        = serialized(String(temperature, 1));
  doc["humedad"]            = serialized(String(humidity, 1));
  doc["timestamp_ms"]       = millis();

  char buffer[350];
  serializeJson(doc, buffer);

  bool ok = mqttClient.publish(TOPIC_PUB, buffer);
  if (ok) {
    Serial.println("[MQTT >>] Telemetría enviada a: " + String(TOPIC_PUB));
    Serial.println(buffer);
  } else {
    Serial.println("[MQTT !!] Error al publicar telemetría.");
  }
}

// ==========================================
// CONEXIÓN WIFI
// ==========================================
void setupWiFi() {
  Serial.printf("\n[WiFi] Conectando a %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(300);
    Serial.print(".");
    intentos++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Conectado exitosamente. IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Advertencia: Modo offline o simulación.");
  }
}

// ==========================================
// RECONEXIÓN MQTT
// ==========================================
void reconnectMQTT() {
  if (mqttClient.connected()) return;

  Serial.print("[MQTT] Conectando a broker HiveMQ...");
  String clientId = "OpTurize-" + String(random(0xffff), HEX);
  if (mqttClient.connect(clientId.c_str())) {
    Serial.println(" Conectado!");
    mqttClient.subscribe(TOPIC_SUB);
    Serial.printf("[MQTT <<] Suscrito al tópico de control: %s\n", TOPIC_SUB);
  } else {
    Serial.printf(" Falló (rc=%d). Reintentando luego...\n", mqttClient.state());
  }
}

// ==========================================
// CALLBACK MQTT (Control remoto desde la nube)
// ==========================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.printf("[MQTT <<] Mensaje recibido en [%s]: %s\n", topic, message.c_str());

  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (!error) {
    if (doc.containsKey("comando")) {
      const char* cmd = doc["comando"];
      if (strcmp(cmd, "reset_aforo") == 0) {
        currentOccupancy = 0;
        Serial.println("[COMANDO] Aforo reseteado a 0 por control remoto.");
      } else if (strcmp(cmd, "set_capacidad") == 0 && doc.containsKey("valor")) {
        maxCapacity = doc["valor"];
        warningThreshold = (int)(maxCapacity * 0.7);
        Serial.printf("[COMANDO] Capacidad máxima actualizada a %d\n", maxCapacity);
      } else if (strcmp(cmd, "forzar_barrera") == 0 && doc.containsKey("abrir")) {
        bool abrir = doc["abrir"];
        barrierServo.write(abrir ? 90 : 0);
        barrierOpen = abrir;
        Serial.printf("[COMANDO] Barrera forzada: %s\n", abrir ? "ABIERTA" : "CERRADA");
      }
      updateTrafficState();
      updateActuators();
      updateDisplay();
      publishTelemetry();
    }
  }
}
