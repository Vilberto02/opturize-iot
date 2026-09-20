from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import get_fogg_recommendations


class RecommendationListAPIView(APIView):
    """
    Endpoint para consultar recomendaciones de destinos alternativos
    basadas en el Modelo de Comportamiento de Fogg (B = MAP).
    """
    def get(self, request):
        origin_id = request.query_params.get('origin_id')
        if origin_id:
            try:
                origin_id = int(origin_id)
            except ValueError:
                return Response({"error": "origin_id debe ser un entero válido."}, status=status.HTTP_400_BAD_REQUEST)

        recommendations = get_fogg_recommendations(origin_place_id=origin_id)
        return Response({
            "count": len(recommendations),
            "model_applied": "Fogg Behavior Model (B = MAP)",
            "results": recommendations
        })
