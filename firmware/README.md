# Firmware y simulación Wokwi — OpTurize

Este módulo contiene el firmware en C++/Arduino para el microcontrolador **ESP32 DevKit V1** y el esquema circuital completo para simular el sistema en **Wokwi**, siguiendo el diseño presentado en el **Laboratorio 03**.

## Archivos del módulo

* **[`sketch.ino`](./sketch.ino):** Código fuente C++ para ESP32 con máquina de estados de aforo, control de actuadores, display OLED y telemetría MQTT.
* **[`diagram.json`](./diagram.json):** Conexiones y disposición visual de los componentes en Wokwi.
* **[`libraries.txt`](./libraries.txt):** Dependencias para el compilador de Wokwi (Adafruit SSD1306, ESP32Servo, ArduinoJson, PubSubClient, etc.).
* **[`wokwi.toml`](./wokwi.toml):** Configuración para la extensión de Wokwi en VS Code.


## Asignación de pines (Pinout)

| Componente | Tipo | Pines ESP32 | Función |
| :--- | :--- | :--- | :--- |
| **HC-SR04 Entrada** | Sensor Ultrasónico | Trig: `D5`, Echo: `D18` | Conteo de ingresos de visitantes |
| **HC-SR04 Salida** | Sensor Ultrasónico | Trig: `D19`, Echo: `D25` | Conteo de salidas de visitantes |
| **DHT22** | Sensor Clima | Datos: `D4` | Monitoreo de temperatura y humedad |
| **SSD1306 (128x64)** | Display OLED I2C | SDA: `D21`, SCL: `D22` | Información visual local y barra de aforo |
| **LED Verde** | Semáforo | GPIO: `D12` (+ 220Ω) | Estado: Libre (Acceso permitido) |
| **LED Amarillo** | Semáforo | GPIO: `D14` (+ 220Ω) | Estado: Moderado (Alerta de capacidad) |
| **LED Rojo** | Semáforo | GPIO: `D27` (+ 220Ω) | Estado: Lleno (Acceso bloqueado) |
| **Servo SG90** | Talanquera | PWM: `D13` | Barrera física (90° abierta, 0° cerrada) |
| **Buzzer Activo** | Alarma Sonora | Digital: `D23` | Pitido de paso y sirena de rechazo |


## Cómo ejecutar la simulación

### Opción 1: En VS Code (con extensión Wokwi)
1. Instala la extensión oficial **Wokwi Simulator** desde el marketplace de VS Code.
2. Abre la paleta de comandos (`Ctrl + Shift + P` o `F1`).
3. Ejecuta `Wokwi: Start Simulator`.
4. Selecciona la carpeta `firmware/` o el archivo `diagram.json`.

### Opción 2: En el Navegador Web (Wokwi Web)
1. Ingresa a [wokwi.com/projects/new/esp32](https://wokwi.com/projects/new/esp32).
2. Pega el contenido de `sketch.ino` en la pestaña de código.
3. En la pestaña `diagram.json`, reemplaza el JSON con el contenido de `firmware/diagram.json`.
4. En la pestaña `Library Manager` (o creando `libraries.txt`), añade las librerías indicadas en `libraries.txt`.
5. Presiona el botón verde de **Play / Simular**.

## Pruebas y validación manual

1. **Simular Entrada de Visitantes:**
   * Haz clic sobre el sensor ultrasónico de entrada (`us_entry`).
   * Desliza la barra de distancia por debajo de **80 cm**.
   * Observa cómo:
     * El aforo incrementa en la consola Serial y en la pantalla OLED.
     * La barra de progreso gráfica del display se llena.
     * Suena un pitido corto en el buzzer.
2. **Alcanzar Aforo Moderado (Alerta):**
   * Continúa ingresando personas hasta superar 14 visitantes (70% de 20).
   * El semáforo conmuta al **LED Amarillo**, indicando estado de moderación.
3. **Alcanzar Aforo Máximo (Saturación y Bloqueo):**
   * Incrementa el conteo hasta llegar a 20 visitantes.
   * El semáforo enciende el **LED Rojo**.
   * El servomotor SG90 gira a **0 grados** cerrando la talanquera.
   * Si intentas deslizar nuevamente el sensor de entrada, el acceso es rechazado y el buzzer emite una **alarma intermitente**.
4. **Simular Salida:**
   * Haz clic sobre el sensor de salida (`us_exit`) y desliza a menos de 80 cm.
   * El aforo disminuye, el semáforo regresa a verde/amarillo y la talanquera se reabre automáticamente.
5. **Comprobar Telemetría MQTT:**
   * En la consola serial se observarán los paquetes JSON publicados periódicamente en `opturize/turismo/ESP32-TURISMO-01/telemetria` en el broker HiveMQ.
