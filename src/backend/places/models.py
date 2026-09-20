from django.db import models
from django.utils import timezone


class TouristPlace(models.Model):
    class Category(models.TextChoices):
        ARQUEOLOGICO = 'ARQUEOLOGICO', 'Complejo Arqueológico'
        NATURAL = 'NATURAL', 'Reserva Natural / Paisaje'
        HISTORICO = 'HISTORICO', 'Centro Histórico'
        MUSEO = 'MUSEO', 'Museo'

    class TrafficState(models.TextChoices):
        VERDE = 'VERDE', 'Libre (Acceso permitido)'
        AMARILLO = 'AMARILLO', 'Moderado (Alerta de capacidad)'
        ROJO = 'ROJO', 'Lleno (Acceso restringido)'

    name = models.CharField('Nombre del atractivo', max_length=150)
    slug = models.SlugField('Identificador URL', unique=True)
    category = models.CharField('Categoría', max_length=20, choices=Category.choices, default=Category.ARQUEOLOGICO)
    
    # Ubicación Geográfica
    department = models.CharField('Departamento', max_length=80, default='Lima')
    province = models.CharField('Provincia', max_length=80, default='Lima')
    district = models.CharField('Distrito', max_length=80)
    latitude = models.DecimalField('Latitud', max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField('Longitud', max_digits=9, decimal_places=6, null=True, blank=True)

    # Identificador de Hardware IoT
    device_id = models.CharField(
        'ID Dispositivo IoT',
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        help_text='Identificador asignado en el firmware (ej: ESP32-TURISMO-01)'
    )

    # Parámetros de Aforo
    max_capacity = models.PositiveIntegerField('Capacidad Máxima Permitida', default=20)
    warning_threshold_pct = models.FloatField('Umbral de Alerta (%)', default=70.0)
    current_occupancy = models.PositiveIntegerField('Aforo Actual', default=0)
    traffic_state = models.CharField('Estado del Semáforo', max_length=10, choices=TrafficState.choices, default=TrafficState.VERDE)
    barrier_open = models.BooleanField('Talanquera Abierta', default=True)

    # Variables Ambientales Recientes
    current_temperature = models.FloatField('Temperatura Actual (°C)', null=True, blank=True)
    current_humidity = models.FloatField('Humedad Actual (%)', null=True, blank=True)

    # Persuasión y Modelo de Fogg
    is_alternative_destination = models.BooleanField(
        '¿Es destino alternativo?',
        default=False,
        help_text='Activar para destinos secundarios que se desean promocionar cuando otros estén saturados'
    )
    description = models.TextField('Descripción del Lugar', blank=True)
    fogg_motivation_text = models.TextField(
        'Mensaje Persuasivo Fogg (Motivación)',
        blank=True,
        help_text='Texto para incentivar al turista (ej: Sin colas, guiado exclusivo, 20% descuento).'
    )
    average_visit_duration_min = models.PositiveIntegerField('Duración Media de Visita (min)', default=45)

    last_telemetry_at = models.DateTimeField('Última Telemetría Recibida', null=True, blank=True)
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Lugar Turístico'
        verbose_name_plural = 'Lugares Turísticos'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.district}) - {self.current_occupancy}/{self.max_capacity}"

    @property
    def occupancy_percentage(self) -> float:
        if self.max_capacity > 0:
            return round((self.current_occupancy / self.max_capacity) * 100.0, 1)
        return 0.0

    @property
    def is_saturated(self) -> bool:
        return self.current_occupancy >= self.max_capacity

    def update_occupancy_and_state(self, new_occupancy: int, temp=None, hum=None, barrier=None):
        self.current_occupancy = max(0, new_occupancy)
        pct = self.occupancy_percentage

        if self.current_occupancy >= self.max_capacity:
            self.traffic_state = self.TrafficState.ROJO
            self.barrier_open = False if barrier is None else barrier
        elif pct >= self.warning_threshold_pct:
            self.traffic_state = self.TrafficState.AMARILLO
            self.barrier_open = True if barrier is None else barrier
        else:
            self.traffic_state = self.TrafficState.VERDE
            self.barrier_open = True if barrier is None else barrier

        if temp is not None:
            self.current_temperature = temp
        if hum is not None:
            self.current_humidity = hum

        self.last_telemetry_at = timezone.now()
        self.save()


class TelemetryLog(models.Model):
    place = models.ForeignKey(TouristPlace, on_delete=models.CASCADE, related_name='telemetry_logs', verbose_name='Lugar Turístico')
    device_id = models.CharField('ID Dispositivo', max_length=64, db_index=True)
    occupancy = models.PositiveIntegerField('Aforo Registrado')
    max_capacity = models.PositiveIntegerField('Capacidad Máxima')
    occupancy_pct = models.FloatField('Porcentaje de Aforo (%)')
    traffic_state = models.CharField('Semáforo', max_length=10)
    barrier_open = models.BooleanField('Talanquera Abierta')
    temperature = models.FloatField('Temperatura (°C)', null=True, blank=True)
    humidity = models.FloatField('Humedad (%)', null=True, blank=True)
    raw_payload = models.JSONField('Payload JSON Original', null=True, blank=True)
    timestamp = models.DateTimeField('Estampa de Tiempo (UTC)', auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Registro de Telemetría'
        verbose_name_plural = 'Histórico de Telemetría'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {self.place.name}: {self.occupancy}/{self.max_capacity} ({self.traffic_state})"


class CrowdAlert(models.Model):
    class Severity(models.TextChoices):
        INFO = 'INFO', 'Informativo'
        WARNING = 'WARNING', 'Advertencia (Aforo Moderado)'
        CRITICAL = 'CRITICAL', 'Crítico (Sobreaforo o Acceso Forzado)'

    place = models.ForeignKey(TouristPlace, on_delete=models.CASCADE, related_name='alerts', verbose_name='Lugar Turístico')
    severity = models.CharField('Severidad', max_length=10, choices=Severity.choices, default=Severity.WARNING)
    title = models.CharField('Título de la Alerta', max_length=200)
    message = models.TextField('Detalle de la Alerta')
    occupancy_at_event = models.PositiveIntegerField('Aforo en el Momento')
    resolved = models.BooleanField('¿Alerta Resuelta?', default=False)
    created_at = models.DateTimeField('Fecha y Hora', auto_now_add=True)

    class Meta:
        verbose_name = 'Alerta de Aforo'
        verbose_name_plural = 'Alertas de Aforo'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.place.name}: {self.title}"
