import math
from places.models import TouristPlace


def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Cálculo de distancia geodésica mediante fórmula del semiverseno (Haversine)."""
    if None in (lat1, lon1, lat2, lon2):
        return 5.0 # Distancia por defecto en km si no hay GPS configurado
    
    R = 6371.0 # Radio medio de la Tierra en km
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def get_fogg_recommendations(origin_place_id=None):
    """
    Genera recomendaciones persuasivas hacia destinos alternativos
    cuando los destinos principales están moderados o saturados.
    """
    saturated_places = []
    if origin_place_id:
        p = TouristPlace.objects.filter(id=origin_place_id).first()
        if p:
            saturated_places = [p]
    else:
        # Detectar todos los destinos con aforo en alerta o saturados (>= 70%)
        saturated_places = list(TouristPlace.objects.filter(traffic_state__in=['AMARILLO', 'ROJO']))

    # Si ninguno está saturado, tomar el que tenga mayor ocupación para demostrar el motor
    if not saturated_places:
        highest = TouristPlace.objects.all().order_by('-current_occupancy').first()
        if highest:
            saturated_places = [highest]

    # Destinos candidatos para descongestión: con aforo verde (< 70%)
    alternatives = TouristPlace.objects.filter(traffic_state='VERDE')
    if not alternatives.exists():
        alternatives = TouristPlace.objects.filter(is_alternative_destination=True)

    recommendations = []

    for sat in saturated_places:
        for alt in alternatives:
            if sat.id == alt.id:
                continue

            distance_km = calculate_distance_km(sat.latitude, sat.longitude, alt.latitude, alt.longitude)
            estimated_transit_min = max(5, int(distance_km * 4)) # Estimación de tránsito en Lima (~15 km/h promedio)

            # Componente M (Motivación): Mayor si el alternativo tiene mucho espacio libre y mensaje atractivo
            free_slots = max(0, alt.max_capacity - alt.current_occupancy)
            motivation_score = min(1.0, 0.5 + (free_slots / max(1, alt.max_capacity)) * 0.5)
            
            # Componente A (Habilidad / Facilidad): Inversamente proporcional a la distancia/tiempo
            ability_score = max(0.2, min(1.0, 1.0 - (estimated_transit_min / 60.0)))

            # Componente P (Disparador / Trigger): Muy alto si el origen está ROJO, medio si está AMARILLO
            trigger_priority = "ALTO" if sat.traffic_state == 'ROJO' else "MEDIO"

            # Score combinado Fogg B = M * A * P
            fogg_index = round(motivation_score * ability_score, 2)

            motivation_msg = alt.fogg_motivation_text or f"Descubre la historia viva en {alt.district}. ¡Sin esperas ni colas!"
            ability_msg = f"A tan solo {distance_km} km ({estimated_transit_min} minutos en transporte) desde tu ubicación."
            
            if sat.traffic_state == 'ROJO':
                trigger_msg = f"{sat.name} ha completado su aforo máximo. ¡Elige {alt.name} y accede inmediatamente!"
            else:
                trigger_msg = f"Afluencia alta en {sat.name} ({sat.occupancy_percentage}%). Recomendamos visitar {alt.name} para un recorrido tranquilo."

            # Mensajes compactos para la tarjeta; los textos completos siguen disponibles para el banner.
            motivation_short = alt.fogg_motivation_short.strip() or f"Descubre una alternativa en {alt.district}."
            ability_short = f"A {distance_km:.2f} km · {estimated_transit_min} min en transporte desde el origen."
            if alt.traffic_state == 'VERDE' and free_slots > 0:
                capacity_label = 'cupo libre' if free_slots == 1 else 'cupos libres'
                if sat.traffic_state == 'ROJO':
                    trigger_short = f"Evita la saturación del origen: el destino tiene {free_slots} {capacity_label}."
                else:
                    trigger_short = f"El destino tiene {free_slots} {capacity_label} para una visita más tranquila."
            else:
                trigger_short = "Revisa el aforo del destino antes de iniciar el recorrido."

            recommendations.append({
                "origin_place": {
                    "id": sat.id,
                    "name": sat.name,
                    "current_occupancy": sat.current_occupancy,
                    "max_capacity": sat.max_capacity,
                    "occupancy_percentage": sat.occupancy_percentage,
                    "traffic_state": sat.traffic_state
                },
                "recommended_place": {
                    "id": alt.id,
                    "name": alt.name,
                    "district": alt.district,
                    "category": alt.get_category_display(),
                    "current_occupancy": alt.current_occupancy,
                    "max_capacity": alt.max_capacity,
                    "occupancy_percentage": alt.occupancy_percentage,
                    "traffic_state": alt.traffic_state,
                    "available_capacity": free_slots
                },
                "fogg_model": {
                    "fogg_score": fogg_index,
                    "trigger_priority": trigger_priority,
                    "motivation": motivation_msg,
                    "ability": ability_msg,
                    "trigger": trigger_msg,
                    "motivation_short": motivation_short,
                    "ability_short": ability_short,
                    "trigger_short": trigger_short,
                    "distance_km": distance_km,
                    "estimated_transit_minutes": estimated_transit_min,
                    "cta_button": "Trazar Ruta y Explorar"
                }
            })

    # Ordenar por el score persuasivo de Fogg de mayor a menor
    recommendations.sort(key=lambda x: x['fogg_model']['fogg_score'], reverse=True)
    return recommendations
