from django.contrib import admin
from django.utils.html import format_html
from .models import TouristPlace, TelemetryLog, CrowdAlert


@admin.register(TouristPlace)
class TouristPlaceAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'district',
        'category',
        'device_id',
        'occupancy_badge',
        'state_badge',
        'barrier_status',
        'climate_status',
        'is_alternative_destination',
        'last_telemetry_at'
    )
    list_filter = ('traffic_state', 'category', 'is_alternative_destination', 'district')
    search_fields = ('name', 'district', 'device_id', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('last_telemetry_at', 'created_at', 'updated_at', 'occupancy_badge', 'state_badge')

    fieldsets = (
        ('Identificación del Lugar', {
            'fields': ('name', 'slug', 'category', 'description')
        }),
        ('Ubicación Geográfica', {
            'fields': ('department', 'province', 'district', 'latitude', 'longitude')
        }),
        ('Integración IoT', {
            'fields': ('device_id', 'max_capacity', 'warning_threshold_pct', 'current_occupancy', 'traffic_state', 'barrier_open')
        }),
        ('Variables Ambientales', {
            'fields': ('current_temperature', 'current_humidity', 'last_telemetry_at')
        }),
        ('Estrategia de Descongestión (Modelo de Fogg)', {
            'fields': ('is_alternative_destination', 'fogg_motivation_text', 'fogg_motivation_short', 'average_visit_duration_min')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def occupancy_badge(self, obj):
        pct = obj.occupancy_percentage
        color = "#28a745" if pct < 70 else ("#ffc107" if pct < 100 else "#dc3545")
        text_color = "#000" if pct >= 70 and pct < 100 else "#fff"
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 3px 8px; border-radius: 4px; font-weight: bold;">'
            '{} / {} ({}%)</span>',
            color, text_color, obj.current_occupancy, obj.max_capacity, pct
        )
    occupancy_badge.short_description = 'Aforo Actual'

    def state_badge(self, obj):
        colors = {
            'VERDE': ('#28a745', '#fff', 'LIBRE'),
            'AMARILLO': ('#ffc107', '#000', 'MODERADO'),
            'ROJO': ('#dc3545', '#fff', 'LLENO'),
        }
        bg, fg, label = colors.get(obj.traffic_state, ('#6c757d', '#fff', obj.traffic_state))
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 3px 8px; border-radius: 4px; font-weight: bold;">{}</span>',
            bg, fg, label
        )
    state_badge.short_description = 'Semáforo'

    def barrier_status(self, obj):
        return "Abierta" if obj.barrier_open else "Cerrada"
    barrier_status.short_description = 'Talanquera'

    def climate_status(self, obj):
        t = f"{obj.current_temperature:.1f}°C" if obj.current_temperature is not None else "--"
        h = f"{obj.current_humidity:.0f}%" if obj.current_humidity is not None else "--"
        return f"{t} | {h}"
    climate_status.short_description = 'Clima'

    actions = ['reset_occupancy', 'force_open_barrier', 'force_close_barrier']

    @admin.action(description='Resetear aforo seleccionado a 0')
    def reset_occupancy(self, request, queryset):
        for place in queryset:
            place.update_occupancy_and_state(0)
        self.message_user(request, "Aforos reseteados exitosamente a 0.")

    @admin.action(description='Forzar apertura de talanquera')
    def force_open_barrier(self, request, queryset):
        queryset.update(barrier_open=True)
        self.message_user(request, "Talanqueras abiertas manualmente.")

    @admin.action(description='Forzar cierre de talanquera (bloqueo preventivo)')
    def force_close_barrier(self, request, queryset):
        queryset.update(barrier_open=False)
        self.message_user(request, "Talanqueras cerradas manualmente.")


@admin.register(TelemetryLog)
class TelemetryLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'place', 'device_id', 'occupancy', 'max_capacity', 'occupancy_pct', 'traffic_state', 'temperature', 'humidity')
    list_filter = ('traffic_state', 'place', 'device_id')
    search_fields = ('place__name', 'device_id')
    readonly_fields = ('timestamp', 'place', 'device_id', 'occupancy', 'max_capacity', 'occupancy_pct', 'traffic_state', 'barrier_open', 'temperature', 'humidity', 'raw_payload')
    date_hierarchy = 'timestamp'


@admin.register(CrowdAlert)
class CrowdAlertAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'place', 'severity_badge', 'title', 'occupancy_at_event', 'resolved')
    list_filter = ('severity', 'resolved', 'place')
    search_fields = ('title', 'message', 'place__name')
    list_editable = ('resolved',)

    def severity_badge(self, obj):
        colors = {
            'INFO': '#17a2b8',
            'WARNING': '#ffc107',
            'CRITICAL': '#dc3545'
        }
        color = colors.get(obj.severity, '#6c757d')
        text_color = '#000' if obj.severity == 'WARNING' else '#fff'
        return format_html(
            '<span style="background-color: {}; color: {}; padding: 3px 8px; border-radius: 4px; font-weight: bold;">{}</span>',
            color, text_color, obj.get_severity_display()
        )
    severity_badge.short_description = 'Severidad'
