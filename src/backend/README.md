# Backend OpTurize

Backend central del sistema **OpTurize (SIT-Opt)** para monitoreo en tiempo real, gestión de aforo, control de acceso y motor de recomendación persuasiva de destinos turísticos alternativos (Modelo de Fogg).

## Stack Tecnológico

* **Lenguaje:** Python 3.14 / 3.11+
* **Framework:** Django 5.2 + Django REST Framework (DRF)
* **Panel de Administración:** Django-Jazzmin con diseño visual adaptado
* **Protocolo IoT:** MQTT (Paho-MQTT v2) suscrito a `opturize/turismo/+/telemetria`
* **Persistencia:** SQLite (`db.sqlite3` en desarrollo local) $\rightarrow$ PostgreSQL en AWS RDS
* **CORS:** `django-cors-headers` configurado para el frontend TanStack
* **Analítica & Persuasión:** Motor basado en el **Modelo de Comportamiento de Fogg** ($B = MAP$)

## Estructura del módulo

```
src/backend/
├── .venv/                         # Entorno virtual de Python (ignorado por Git)
├── opturize_core/                 # Núcleo de configuración de Django
│   ├── settings.py                # Configuración DRF, CORS, Jazzmin, MQTT
│   └── urls.py                    # Enrutador maestro
├── places/                        # App de Lugares Turísticos y Aforo
│   ├── models.py                  # TouristPlace, TelemetryLog, CrowdAlert
│   ├── serializers.py             # Serializadores REST
│   ├── views.py                   # ViewSets y endpoints de telemetría y control
│   ├── urls.py                    # Rutas /api/places/ y /api/telemetry/
│   ├── admin.py                   # Panel visual con badges de aforo y semáforo
│   └── management/commands/
│       └── seed_places.py         # Precarga de lugares de prueba en Lima
├── recommendations/               # Motor de Persuasión (Modelo de Fogg)
│   ├── services.py                # Algoritmo B = MAP, distancia y disparadores
│   ├── views.py                   # Endpoint /api/recommendations/
│   └── urls.py
├── iot/                           # Módulo de Comunicación IoT
│   ├── mqtt_service.py            # Parser de payloads y publicación de comandos
│   └── management/commands/
│       └── run_mqtt.py            # Listener MQTT en segundo plano
├── manage.py
├── requirements.txt
└── .env                           # Variables de entorno locales
```

---

## Puesta en marcha (Local)

### 1. Activar el Entorno Virtual

En Windows (PowerShell):
```powershell
cd src/backend
.venv\Scripts\Activate.ps1
```

### 2. Ejecutar migraciones y precargar datos
```powershell
python manage.py migrate
python manage.py seed_places
```

### 3. Iniciar el servidor de la API REST
```powershell
python manage.py runserver
```
* **API REST:** [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
* **Panel Administrativo (Jazzmin):** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
  * **Usuario:** `admin`
  * **Contraseña:** `admin12345`

### 4. Iniciar el listener MQTT (Receptor de Telemetría ESP32)
En una terminal separada:
```powershell
cd src/backend
.venv\Scripts\Activate.ps1
python manage.py run_mqtt
```

## Catálogo de Endpoints REST

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health/` | Verificación de estado del backend y broker MQTT. |
| `GET` | `/api/places/` | Lista de atractivos con aforo en vivo, semáforo y clima. |
| `GET` | `/api/places/<id>/` | Detalle de un atractivo con sus alertas activas y logs recientes. |
| `GET` | `/api/places/<id>/history/` | Serie temporal de afluencia para gráficos TanStack. |
| `POST` | `/api/places/<id>/control/` | Envío de comandos remotos MQTT hacia el ESP32 (`reset_aforo`, `set_capacidad`, `forzar_barrera`). |
| `GET` | `/api/recommendations/` | Destinos alternativos con incentivos persuasivos de Fogg ($B = MAP$). |
| `POST` | `/api/telemetry/` | Ingesta HTTP alternativa de telemetría IoT. |

---

## Ejecución de pruebas

```powershell
cd src/backend
python manage.py test
```
Ejecuta la suite de pruebas unitarias y de integración que validan:
* Estado del servicio y health check.
* Listado y detalle de atractivos turísticos.
* Ingesta HTTP de paquetes de aforo y disparador de alertas.
* Generación de recomendaciones y cálculo del índice Fogg.
