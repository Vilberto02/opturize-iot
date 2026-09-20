from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TouristPlaceViewSet, TelemetryIngestAPIView, HealthCheckAPIView

router = DefaultRouter()
router.register(r'places', TouristPlaceViewSet, basename='tourist-place')

urlpatterns = [
    path('health/', HealthCheckAPIView.as_view(), name='api-health'),
    path('telemetry/', TelemetryIngestAPIView.as_view(), name='api-telemetry-ingest'),
    path('', include(router.urls)),
]
