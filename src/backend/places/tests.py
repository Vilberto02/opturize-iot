from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from places.models import TouristPlace, TelemetryLog, CrowdAlert
from recommendations.services import get_fogg_recommendations


class TouristPlaceAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.origin = TouristPlace.objects.create(
            name="Huaca Pucllana",
            slug="huaca-pucllana",
            district="Miraflores",
            device_id="ESP32-TURISMO-01",
            max_capacity=20,
            current_occupancy=18,
            traffic_state="AMARILLO",
            barrier_open=True,
            latitude=-12.111222,
            longitude=-77.033611
        )
        self.alternative = TouristPlace.objects.create(
            name="Huaca Huallamarca",
            slug="huaca-huallamarca",
            district="San Isidro",
            device_id="ESP32-TURISMO-02",
            max_capacity=30,
            current_occupancy=5,
            traffic_state="VERDE",
            barrier_open=True,
            is_alternative_destination=True,
            fogg_motivation_text="¡Acceso preferente y museo de sitio!",
            latitude=-12.096389,
            longitude=-77.039722
        )

    def test_health_check_endpoint(self):
        """Verifica que el endpoint /api/health/ responda con status online."""
        url = reverse('api-health')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'online')

    def test_list_places(self):
        """Verifica el listado de atractivos turísticos en /api/places/."""
        url = reverse('tourist-place-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_retrieve_place_detail(self):
        """Verifica el detalle de un atractivo turístico por ID."""
        url = reverse('tourist-place-detail', kwargs={'id': self.origin.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Huaca Pucllana")
        self.assertEqual(response.data['occupancy_percentage'], 90.0)

    def test_telemetry_http_ingest(self):
        """Verifica la ingesta HTTP de telemetría y actualización del aforo."""
        url = reverse('api-telemetry-ingest')
        payload = {
            "id_dispositivo": "ESP32-TURISMO-01",
            "aforo_actual": 20,
            "capacidad_maxima": 20,
            "estado_semaforo": "ROJO",
            "talanquera_abierta": False,
            "temperatura": 23.1,
            "humedad": 71.0
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.origin.refresh_from_db()
        self.assertEqual(self.origin.current_occupancy, 20)
        self.assertEqual(self.origin.traffic_state, "ROJO")
        self.assertFalse(self.origin.barrier_open)

        # Debe haberse registrado el log y la alerta
        self.assertTrue(TelemetryLog.objects.filter(device_id="ESP32-TURISMO-01").exists())
        self.assertTrue(CrowdAlert.objects.filter(place=self.origin).exists())

    def test_fogg_recommendations_endpoint(self):
        """Verifica la generación de recomendaciones persuasivas basadas en Fogg."""
        url = reverse('api-recommendations')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)
        first_rec = response.data['results'][0]
        self.assertIn('fogg_model', first_rec)
        self.assertEqual(first_rec['recommended_place']['name'], "Huaca Huallamarca")
        self.assertIn('motivation', first_rec['fogg_model'])
        self.assertIn('ability', first_rec['fogg_model'])
        self.assertIn('trigger', first_rec['fogg_model'])
