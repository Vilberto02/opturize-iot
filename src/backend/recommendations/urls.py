from django.urls import path
from .views import RecommendationListAPIView

urlpatterns = [
    path('recommendations/', RecommendationListAPIView.as_view(), name='api-recommendations'),
]
