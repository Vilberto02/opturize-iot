from rest_framework import serializers
from .models import TouristPlace, TelemetryLog, CrowdAlert


class TouristPlaceListSerializer(serializers.ModelSerializer):
    occupancy_percentage = serializers.ReadOnlyField()
    is_saturated = serializers.ReadOnlyField()

    class Meta:
        model = TouristPlace
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'department',
            'province',
            'district',
            'latitude',
            'longitude',
            'device_id',
            'max_capacity',
            'warning_threshold_pct',
            'current_occupancy',
            'occupancy_percentage',
            'traffic_state',
            'barrier_open',
            'current_temperature',
            'current_humidity',
            'is_alternative_destination',
            'fogg_motivation_text',
            'average_visit_duration_min',
            'is_saturated',
            'last_telemetry_at'
        ]


class TelemetryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelemetryLog
        fields = [
            'id',
            'timestamp',
            'device_id',
            'occupancy',
            'max_capacity',
            'occupancy_pct',
            'traffic_state',
            'barrier_open',
            'temperature',
            'humidity'
        ]


class CrowdAlertSerializer(serializers.ModelSerializer):
    place_name = serializers.ReadOnlyField(source='place.name')

    class Meta:
        model = CrowdAlert
        fields = [
            'id',
            'place',
            'place_name',
            'severity',
            'title',
            'message',
            'occupancy_at_event',
            'resolved',
            'created_at'
        ]


class TouristPlaceDetailSerializer(TouristPlaceListSerializer):
    recent_logs = serializers.SerializerMethodField()
    active_alerts = serializers.SerializerMethodField()

    class Meta(TouristPlaceListSerializer.Meta):
        fields = TouristPlaceListSerializer.Meta.fields + ['description', 'recent_logs', 'active_alerts']

    def get_recent_logs(self, obj):
        logs = obj.telemetry_logs.all()[:20]
        return TelemetryLogSerializer(logs, many=True).data

    def get_active_alerts(self, obj):
        alerts = obj.alerts.filter(resolved=False)[:10]
        return CrowdAlertSerializer(alerts, many=True).data


class DeviceControlSerializer(serializers.Serializer):
    COMMAND_CHOICES = [
        ('reset_aforo', 'Resetear Aforo a 0'),
        ('set_capacidad', 'Cambiar Capacidad Máxima'),
        ('forzar_barrera', 'Apertura / Cierre Forzado de Talanquera'),
    ]
    comando = serializers.ChoiceField(choices=COMMAND_CHOICES)
    valor = serializers.IntegerField(required=False, min_value=1, max_value=5000)
    abrir = serializers.BooleanField(required=False)

    def validate(self, data):
        cmd = data.get('comando')
        if cmd == 'set_capacidad' and 'valor' not in data:
            raise serializers.ValidationError({"valor": "Debe especificar el campo 'valor' para 'set_capacidad'."})
        if cmd == 'forzar_barrera' and 'abrir' not in data:
            raise serializers.ValidationError({"abrir": "Debe especificar el booleano 'abrir' para 'forzar_barrera'."})
        return data


class TelemetryIngestSerializer(serializers.Serializer):
    id_dispositivo = serializers.CharField(max_length=64)
    lugar_turistico = serializers.CharField(max_length=150, required=False)
    aforo_actual = serializers.IntegerField(min_value=0)
    capacidad_maxima = serializers.IntegerField(min_value=1)
    porcentaje_aforo = serializers.FloatField(required=False)
    estado_semaforo = serializers.ChoiceField(choices=['VERDE', 'AMARILLO', 'ROJO'])
    talanquera_abierta = serializers.BooleanField(default=True)
    temperatura = serializers.FloatField(required=False, allow_null=True)
    humedad = serializers.FloatField(required=False, allow_null=True)
    timestamp_ms = serializers.IntegerField(required=False)
