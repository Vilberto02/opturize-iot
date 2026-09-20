"""
Comando para precargar destinos turísticos iniciales en Lima (monitoreados y alternativos).
Uso: python manage.py seed_places
"""

from django.core.management.base import BaseCommand
from places.models import TouristPlace, TelemetryLog


class Command(BaseCommand):
    help = 'Precarga datos iniciales de lugares turísticos para pruebas con Wokwi y TanStack'

    def handle(self, *args, **options):
        places_data = [
            {
                "name": "Huaca Pucllana",
                "slug": "huaca-pucllana",
                "category": TouristPlace.Category.ARQUEOLOGICO,
                "department": "Lima",
                "province": "Lima",
                "district": "Miraflores",
                "latitude": -12.111222,
                "longitude": -77.033611,
                "device_id": "ESP32-TURISMO-01",
                "max_capacity": 20,
                "warning_threshold_pct": 70.0,
                "current_occupancy": 15,
                "traffic_state": TouristPlace.TrafficState.AMARILLO,
                "barrier_open": True,
                "current_temperature": 22.4,
                "current_humidity": 72.0,
                "is_alternative_destination": False,
                "description": "Centro ceremonial de la Cultura Lima (siglo V). Gran afluencia turística en Miraflores.",
                "fogg_motivation_text": "",
                "average_visit_duration_min": 60
            },
            {
                "name": "Huaca Huallamarca",
                "slug": "huaca-huallamarca",
                "category": TouristPlace.Category.ARQUEOLOGICO,
                "department": "Lima",
                "province": "Lima",
                "district": "San Isidro",
                "latitude": -12.096389,
                "longitude": -77.039722,
                "device_id": "ESP32-TURISMO-02",
                "max_capacity": 35,
                "warning_threshold_pct": 70.0,
                "current_occupancy": 5,
                "traffic_state": TouristPlace.TrafficState.VERDE,
                "barrier_open": True,
                "current_temperature": 21.8,
                "current_humidity": 75.0,
                "is_alternative_destination": True,
                "description": "Imponente pirámide trunca preincaica restaurada con museo de sitio interactivo.",
                "fogg_motivation_text": "¡Descubre la arqueología en San Isidro con 20% de descuento en boletería y visita guiada sin colas!",
                "average_visit_duration_min": 45
            },
            {
                "name": "Complejo Arqueológico Mateo Salado",
                "slug": "mateo-salado",
                "category": TouristPlace.Category.ARQUEOLOGICO,
                "department": "Lima",
                "province": "Lima",
                "district": "Pueblo Libre",
                "latitude": -12.072222,
                "longitude": -77.066944,
                "device_id": "ESP32-TURISMO-03",
                "max_capacity": 45,
                "warning_threshold_pct": 70.0,
                "current_occupancy": 8,
                "traffic_state": TouristPlace.TrafficState.VERDE,
                "barrier_open": True,
                "current_temperature": 22.0,
                "current_humidity": 73.0,
                "is_alternative_destination": True,
                "description": "Conjunto monumental de cinco pirámides escalonadas de la cultura Ychsma.",
                "fogg_motivation_text": "Uno de los centros ceremoniales más grandes de Lima. Espacio amplio y tranquilo para toda la familia.",
                "average_visit_duration_min": 50
            },
            {
                "name": "Santuario Arqueológico de Pachacamac",
                "slug": "pachacamac",
                "category": TouristPlace.Category.ARQUEOLOGICO,
                "department": "Lima",
                "province": "Lima",
                "district": "Lurín",
                "latitude": -12.259167,
                "longitude": -76.900278,
                "device_id": "ESP32-TURISMO-04",
                "max_capacity": 100,
                "warning_threshold_pct": 70.0,
                "current_occupancy": 24,
                "traffic_state": TouristPlace.TrafficState.VERDE,
                "barrier_open": True,
                "current_temperature": 23.5,
                "current_humidity": 68.0,
                "is_alternative_destination": True,
                "description": "El oráculo sagrado más trascendente de la costa andina. Gran museo de sitio nacional.",
                "fogg_motivation_text": "Pase de transporte turístico directo disponible y recorrido panorámico al Templo del Sol.",
                "average_visit_duration_min": 90
            }
        ]

        created_count = 0
        updated_count = 0

        for item in places_data:
            slug = item.pop('slug')
            place, created = TouristPlace.objects.update_or_create(slug=slug, defaults=item)
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"[+] Creado: {place.name}"))
            else:
                updated_count += 1
                self.stdout.write(self.style.NOTICE(f"[*] Actualizado: {place.name}"))

            # Crear un registro inicial de telemetría de prueba
            TelemetryLog.objects.create(
                place=place,
                device_id=place.device_id or "SIMULADOR",
                occupancy=place.current_occupancy,
                max_capacity=place.max_capacity,
                occupancy_pct=place.occupancy_percentage,
                traffic_state=place.traffic_state,
                barrier_open=place.barrier_open,
                temperature=place.current_temperature,
                humidity=place.current_humidity
            )

        self.stdout.write(self.style.SUCCESS(
            f"\nProceso finalizado: {created_count} lugares creados, {updated_count} actualizados."
        ))
