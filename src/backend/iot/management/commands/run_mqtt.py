"""
Comando de Gestión de Django para escuchar telemetría MQTT en segundo plano.
Uso: python manage.py run_mqtt
"""

import sys
import time
import random
from django.core.management.base import BaseCommand
from django.conf import settings
import paho.mqtt.client as mqtt
from iot.mqtt_service import process_telemetry_payload


class Command(BaseCommand):
    help = 'Inicia el listener de telemetría MQTT para los microcontroladores ESP32 de OpTurize'

    def handle(self, *args, **options):
        broker_host = settings.MQTT_BROKER_HOST
        broker_port = settings.MQTT_BROKER_PORT
        topic = settings.MQTT_TELEMETRY_TOPIC

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  OpTurize (SIT-Opt) — Listener MQTT de Telemetría"))
        self.stdout.write(self.style.SUCCESS(f"  Conectando a {broker_host}:{broker_port}"))
        self.stdout.write(self.style.SUCCESS(f"  Tópico suscrito: {topic}"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        client_id = f"OpTurize-Backend-{random.randint(1000, 9999)}"

        try:
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
        except AttributeError:
            client = mqtt.Client(client_id=client_id)

        def on_connect(client, userdata, flags, rc, *extra):
            code = getattr(rc, 'value', rc)
            if code == 0:
                self.stdout.write(self.style.SUCCESS(f"[+] Conectado exitosamente al broker MQTT {broker_host}"))
                client.subscribe(topic)
                self.stdout.write(self.style.SUCCESS(f"[+] Suscripción activa a '{topic}'"))
            else:
                self.stdout.write(self.style.ERROR(f"[-] Falló conexión MQTT con código: {code}"))

        def on_message(client, userdata, msg):
            try:
                payload_str = msg.payload.decode('utf-8')
                self.stdout.write(self.style.NOTICE(f"\n[MQTT Recibido] Tópico: {msg.topic}"))
                self.stdout.write(f"Payload: {payload_str}")
                ok = process_telemetry_payload(msg.topic, payload_str)
                if ok:
                    self.stdout.write(self.style.SUCCESS("[OK] Datos sincronizados en Base de Datos."))
                else:
                    self.stdout.write(self.style.WARNING("[!] Mensaje recibido pero no asociado a un lugar registrado."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[Error Procesando Mensaje] {e}"))

        client.on_connect = on_connect
        client.on_message = on_message

        try:
            client.connect(broker_host, broker_port, 60)
            self.stdout.write(self.style.NOTICE("Escuchando eventos de aforo en vivo (Presiona Ctrl+C para salir)...\n"))
            client.loop_forever()
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("\nListener MQTT detenido por el usuario."))
            client.disconnect()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error fatal en cliente MQTT: {e}"))
            sys.exit(1)
