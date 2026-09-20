import json
import logging
from django.conf import settings
from django.db import close_old_connections
import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish

logger = logging.getLogger(__name__)


def process_telemetry_payload(topic: str, payload_str: str):
    """
    Procesa un payload JSON recibido vía MQTT y actualiza los modelos de Django.
    """
    close_old_connections()
    from places.models import TouristPlace, TelemetryLog, CrowdAlert

    try:
        data = json.loads(payload_str)
    except json.JSONDecodeError as e:
        logger.error(f"[MQTT Error] Payload JSON inválido recibido en {topic}: {e}")
        return False

    device_id = data.get('id_dispositivo')
    if not device_id:
        # Intentar extraer ID del tópico (opturize/turismo/<DEVICE_ID>/telemetria)
        parts = topic.split('/')
        if len(parts) >= 4:
            device_id = parts[2]

    if not device_id:
        logger.warning(f"[MQTT Warning] No se encontró device_id en el mensaje de {topic}")
        return False

    occupancy = data.get('aforo_actual', 0)
    max_cap = data.get('capacidad_maxima')
    state = data.get('estado_semaforo', 'VERDE')
    barrier = data.get('talanquera_abierta', True)
    temp = float(data['temperatura']) if 'temperatura' in data and data['temperatura'] is not None else None
    hum = float(data['humedad']) if 'humedad' in data and data['humedad'] is not None else None

    # Buscar lugar turístico por device_id
    place = TouristPlace.objects.filter(device_id=device_id).first()
    if not place and 'lugar_turistico' in data:
        place = TouristPlace.objects.filter(name__icontains=data['lugar_turistico']).first()

    if not place:
        logger.warning(f"[MQTT] Dispositivo '{device_id}' no está registrado en la base de datos.")
        return False

    if max_cap is not None:
        place.max_capacity = max_cap

    # Actualizar estado del lugar
    place.update_occupancy_and_state(occupancy, temp=temp, hum=hum, barrier=barrier)

    # Registrar en serie temporal
    TelemetryLog.objects.create(
        place=place,
        device_id=device_id,
        occupancy=occupancy,
        max_capacity=place.max_capacity,
        occupancy_pct=place.occupancy_percentage,
        traffic_state=state,
        barrier_open=barrier,
        temperature=temp,
        humidity=hum,
        raw_payload=data
    )

    # Generar alerta de sobreaforo si corresponde
    if occupancy >= place.max_capacity:
        CrowdAlert.objects.create(
            place=place,
            severity=CrowdAlert.Severity.CRITICAL,
            title="Aforo Máximo Excedido",
            message=f"El aforo alcanzó {occupancy}/{place.max_capacity} visitantes. Talanquera cerrada.",
            occupancy_at_event=occupancy
        )

    print(f"[MQTT >> DB] {place.name} actualizado: Aforo {occupancy}/{place.max_capacity} ({state})")
    return True


def publish_control_command(topic: str, command_dict: dict) -> bool:
    """
    Publica un comando JSON hacia un microcontrolador ESP32 vía MQTT.
    """
    try:
        payload = json.dumps(command_dict)
        publish.single(
            topic,
            payload=payload,
            hostname=settings.MQTT_BROKER_HOST,
            port=settings.MQTT_BROKER_PORT,
            qos=1
        )
        logger.info(f"[MQTT CMD] Comando publicado en {topic}: {payload}")
        return True
    except Exception as e:
        logger.error(f"[MQTT CMD Error] Fallo al publicar en {topic}: {e}")
        return False
