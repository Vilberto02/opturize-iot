from django.core.exceptions import ValidationError
from django.forms import modelform_factory
from django.test import TestCase
from django.urls import reverse

from places.models import TouristPlace
from .services import get_fogg_recommendations


class RecommendationShortMessageTests(TestCase):
    def setUp(self):
        self.origin = TouristPlace.objects.create(
            name='Huaca Pucllana', slug='origen', district='Miraflores',
            max_capacity=20, current_occupancy=18, traffic_state='AMARILLO',
            latitude=-12.111222, longitude=-77.033611,
        )
        self.target = TouristPlace.objects.create(
            name='Huaca Huallamarca', slug='destino', district='San Isidro',
            max_capacity=30, current_occupancy=5, traffic_state='VERDE',
            is_alternative_destination=True,
            fogg_motivation_text='Descubre el museo de sitio con acceso preferente y visitas guiadas.',
            fogg_motivation_short='Museo de sitio y acceso preferente.',
            latitude=-12.096389, longitude=-77.039722,
        )

    def test_api_adds_short_messages_and_preserves_original_content(self):
        response = self.client.get(reverse('api-recommendations'), {'origin_id': self.origin.id})
        self.assertEqual(response.status_code, 200)
        item = response.json()['results'][0]
        fogg = item['fogg_model']
        self.assertEqual(item['recommended_place']['id'], self.target.id)
        self.assertEqual(fogg['motivation'], self.target.fogg_motivation_text)
        self.assertEqual(fogg['motivation_short'], self.target.fogg_motivation_short)
        self.assertIn('desde tu ubicación', fogg['ability'])
        self.assertIn(self.origin.name, fogg['trigger'])
        self.assertIn('25 cupos libres', fogg['trigger_short'])
        self.assertEqual(fogg['cta_button'], 'Trazar Ruta y Explorar')

    def test_blank_short_motivation_uses_destination_district(self):
        for text in ('', '   '):
            with self.subTest(text=text):
                self.target.fogg_motivation_short = text
                self.target.save()
                fogg = get_fogg_recommendations(self.origin.id)[0]['fogg_model']
                self.assertEqual(fogg['motivation_short'], 'Descubre una alternativa en San Isidro.')
                self.assertEqual(fogg['motivation'], self.target.fogg_motivation_text)

    def test_messages_use_each_route_data_and_keep_score_order(self):
        other = TouristPlace.objects.create(
            name='Pachacamac', slug='pachacamac', district='Lurín',
            max_capacity=100, current_occupancy=24, traffic_state='VERDE',
            latitude=-12.259167, longitude=-76.900278,
            fogg_motivation_short='Recorrido panorámico al Templo del Sol.',
        )
        items = get_fogg_recommendations(self.origin.id)
        self.assertEqual(len(items), 2)
        scores = [item['fogg_model']['fogg_score'] for item in items]
        self.assertEqual(scores, sorted(scores, reverse=True))
        by_target = {item['recommended_place']['id']: item for item in items}
        self.assertNotEqual(
            by_target[self.target.id]['fogg_model']['ability_short'],
            by_target[other.id]['fogg_model']['ability_short'],
        )
        for target in (self.target, other):
            fogg = by_target[target.id]['fogg_model']
            self.assertEqual(fogg['motivation_short'], target.fogg_motivation_short)
            self.assertIn(f"{fogg['distance_km']:.2f} km", fogg['ability_short'])
            self.assertIn(f"{fogg['estimated_transit_minutes']} min", fogg['ability_short'])
            self.assertIn(str(target.max_capacity - target.current_occupancy), fogg['trigger_short'])

    def test_trigger_reflects_saturation_and_actual_destination_availability(self):
        cases = [
            ('AMARILLO', 'VERDE', 5, '25 cupos libres'),
            ('ROJO', 'VERDE', 5, 'Evita la saturación del origen'),
            ('ROJO', 'VERDE', 29, '1 cupo libre.'),
            ('ROJO', 'VERDE', 30, 'Revisa el aforo'),
            ('ROJO', 'AMARILLO', 25, 'Revisa el aforo'),
            ('ROJO', 'ROJO', 30, 'Revisa el aforo'),
        ]
        for origin_state, target_state, occupancy, expected in cases:
            with self.subTest(origin=origin_state, target=target_state, occupancy=occupancy):
                self.origin.traffic_state = origin_state
                self.origin.save()
                self.target.traffic_state = target_state
                self.target.current_occupancy = occupancy
                self.target.save()
                fogg = get_fogg_recommendations(self.origin.id)[0]['fogg_model']
                self.assertIn(expected, fogg['trigger_short'])
                if expected == 'Revisa el aforo':
                    self.assertNotIn('cupos libres', fogg['trigger_short'])

    def test_motivation_form_accepts_blank_and_limits_editorial_copy(self):
        form_class = modelform_factory(TouristPlace, fields=['fogg_motivation_short'])
        field = form_class.base_fields['fogg_motivation_short']
        self.assertEqual(field.clean(''), '')
        self.assertEqual(field.clean('a' * 140), 'a' * 140)
        with self.assertRaises(ValidationError):
            field.clean('a' * 141)
