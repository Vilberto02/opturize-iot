import json
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.conf import settings

from .models import TouristPlace, TelemetryLog, CrowdAlert
from .serializers import (
    TouristPlaceListSerializer,
    TouristPlaceDetailSerializer,
    TelemetryLogSerializer,
    CrowdAlertSerializer,
    DeviceControlSerializer,
    TelemetryIngestSerializer
)


class TouristPlaceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API REST para consultar atractivos turísticos, niveles de aforo en vivo y semáforo.
    """
    queryset = TouristPlace.objects.all().order_by('name')
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TouristPlaceDetailSerializer
        return TouristPlaceListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        traffic_state = self.request.query_params.get('traffic_state')
        district = self.request.query_params.get('district')
        is_alternative = self.request.query_params.get('is_alternative')

        if traffic_state:
            qs = qs.filter(traffic_state=traffic_state.upper())
        if district:
            qs = qs.filter(district__iexact=district)
        if is_alternative is not None:
            qs = qs.filter(is_alternative_destination=is_alternative.lower() == 'true')
        return qs

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, id=None):
        """Devuelve el histórico de aforo para graficar series de tiempo en TanStack."""
        place = self.get_object()
        limit = int(request.query_params.get('limit', 50))
        logs = place.telemetry_logs.all()[:limit]
        serializer = TelemetryLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='control')
    def control(self, request, id=None):
        """Publica un comando de control remoto MQTT hacia el ESP32 del atractivo."""
        place = self.get_object()
        if not place.device_id:
            return Response(
                {"error": "Este lugar no tiene un microcontrolador ESP32 asignado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DeviceControlSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command_data = serializer.validated_data

        # Enviar vía MQTT al ESP32
        from iot.mqtt_service import publish_control_command
        topic = f"{settings.MQTT_CONTROL_TOPIC_PREFIX}/{place.device_id}/control"
        success = publish_control_command(topic, command_data)

        # Si es reseteo de aforo, reflejarlo de inmediato en BD
        if command_data.get('comando') == 'reset_aforo':
            place.update_occupancy_and_state(0)
        elif command_data.get('comando') == 'set_capacidad':
            place.max_capacity = command_data.get('valor')
            place.save()
        elif command_data.get('comando') == 'forzar_barrera':
            place.barrier_open = command_data.get('abrir')
            place.save()

        return Response({
            "status": "Comando enviado exitosamente" if success else "Encolado / Fallo de transmisión MQTT",
            "device_id": place.device_id,
            "topic": topic,
            "payload": command_data
        })


class TelemetryIngestAPIView(APIView):
    """
    Endpoint alternativo HTTP POST para ingesta directa de telemetría IoT.
    """
    def post(self, request):
        serializer = TelemetryIngestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        device_id = data['id_dispositivo']
        occupancy = data['aforo_actual']
        max_cap = data['capacidad_maxima']
        state = data['estado_semaforo']
        barrier = data.get('talanquera_abierta', True)
        temp = data.get('temperatura')
        hum = data.get('humedad')

        # Buscar o asociar el lugar turístico
        place = TouristPlace.objects.filter(device_id=device_id).first()
        if not place and 'lugar_turistico' in data:
            place = TouristPlace.objects.filter(name__icontains=data['lugar_turistico']).first()

        if not place:
            return Response(
                {"error": f"No se encontró un lugar turístico registrado con device_id='{device_id}'."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Actualizar aforo y estado
        place.max_capacity = max_cap
        place.update_occupancy_and_state(occupancy, temp=temp, hum=hum, barrier=barrier)

        # Guardar en histórico
        TelemetryLog.objects.create(
            place=place,
            device_id=device_id,
            occupancy=occupancy,
            max_capacity=max_cap,
            occupancy_pct=place.occupancy_percentage,
            traffic_state=state,
            barrier_open=barrier,
            temperature=temp,
            humidity=hum,
            raw_payload=request.data
        )

        # Verificar generación de alerta
        if occupancy >= max_cap:
            CrowdAlert.objects.create(
                place=place,
                severity=CrowdAlert.Severity.CRITICAL,
                title="Aforo Máximo Superado",
                message=f"El aforo alcanzó {occupancy}/{max_cap} personas. Talanquera cerrada.",
                occupancy_at_event=occupancy
            )

        return Response({
            "status": "Telemetría procesada y registrada exitosamente",
            "place": place.name,
            "current_occupancy": place.current_occupancy,
            "occupancy_percentage": place.occupancy_percentage,
            "traffic_state": place.traffic_state
        }, status=status.HTTP_201_CREATED)


class HealthCheckAPIView(APIView):
    """
    Comprobación del estado del sistema.
    """
    def get(self, request):
        return Response({
            "status": "online",
            "system": "OpTurize Backend",
            "database": "sqlite (local)",
            "mqtt_broker": f"{settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}",
            "timestamp": timezone.now().isoformat()
        })
