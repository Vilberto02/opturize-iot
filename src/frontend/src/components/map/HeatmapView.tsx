import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { type TouristPlace } from '@/types';
import { MapPinned, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui';
import { prefersReducedMotion } from '@/lib/motion';

interface HeatmapViewProps {
  places: TouristPlace[];
  selectedPlaceId?: number | null;
  onSelectPlace?: (place: TouristPlace) => void;
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

const LIMA_CENTER: [number, number] = [-12.11, -77.02];
const DEFAULT_ZOOM = 12;

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  places,
  selectedPlaceId,
  onSelectPlace,
  className = '',
  isLoading = false,
  emptyMessage = 'No hay lugares con coordenadas disponibles.',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const placesRef = useRef(places);
  placesRef.current = places;
  const lastCenteredPlaceIdRef = useRef<number | null>(null);

  // Inicialización única del mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centro inicial sobre Lima Metropolitana
    const map = L.map(mapContainerRef.current, {
      center: LIMA_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    // OpenStreetMap: mapa satelital/urbano libre de alta disponibilidad sin requerir API key
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Observador de cambio de tamaño para garantizar renderizado de los tiles
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Forzar actualización inicial tras el renderizado del DOM
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Centrado dinámico ÚNICAMENTE cuando el usuario selecciona un nuevo lugar explícitamente
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlaceId) return;

    // Evitar que sondeos de fondo muevan la cámara si el lugar seleccionado no ha cambiado
    if (lastCenteredPlaceIdRef.current === selectedPlaceId) return;
    lastCenteredPlaceIdRef.current = selectedPlaceId;

    const target = placesRef.current.find((p) => p.id === selectedPlaceId);
    if (target && typeof target.latitude === 'number' && typeof target.longitude === 'number') {
      map.flyTo([target.latitude, target.longitude], 14, { duration: 0.9, animate: !prefersReducedMotion() });
    }
  }, [selectedPlaceId]);

  // Actualización reactiva de los círculos térmicos y marcadores cuando cambian los aforos
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    places.forEach((place) => {
      if (typeof place.latitude !== 'number' || !Number.isFinite(place.latitude) || typeof place.longitude !== 'number' || !Number.isFinite(place.longitude)) return;
      const lat: number = place.latitude;
      const lng: number = place.longitude;

      const isSaturated = place.traffic_state === 'ROJO';
      const isModerate = place.traffic_state === 'AMARILLO';
      const isSelected = place.id === selectedPlaceId;

      // Parámetros térmicos según nivel de aforo
      const haloColor = isSaturated ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';
      const haloRadius = isSaturated ? 2200 : isModerate ? 1500 : 900;
      const haloOpacity = isSaturated ? 0.45 : isModerate ? 0.35 : 0.22;

      // 1. Halo térmico externo (simulación de mapa de calor geoespacial)
      const thermalHalo = L.circle([lat, lng], {
        radius: haloRadius,
        color: haloColor,
        weight: 1.5,
        fillColor: haloColor,
        fillOpacity: haloOpacity,
        interactive: false,
      });
      layerGroup.addLayer(thermalHalo);

      // 2. Halo térmico secundario más concentrado
      const innerThermal = L.circle([lat, lng], {
        radius: haloRadius * 0.45,
        color: haloColor,
        weight: 0,
        fillColor: haloColor,
        fillOpacity: haloOpacity * 1.5,
        interactive: false,
      });
      layerGroup.addLayer(innerThermal);

      // 3. Efecto de radar pulsante animado para zonas críticas
      if (isSaturated) {
        const pulseIcon = L.divIcon({
          className: 'radar-pulse-icon',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
              <span class="absolute w-8 h-8 rounded-full bg-rose-500 opacity-60 animate-ping"></span>
              <span class="relative w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-md"></span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const radarMarker = L.marker([lat, lng], { icon: pulseIcon, interactive: false });
        layerGroup.addLayer(radarMarker);
      }

      // 4. Marcador puntual interactivo
      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 12 : 8,
        color: '#ffffff',
        weight: isSelected ? 3 : 2,
        fillColor: haloColor,
        fillOpacity: 1,
      });

      // Contenido del Popup semántico con tipografía clara y sin emojis
      const popupHtml = `
        <div style="font-family: 'DM Sans', sans-serif; padding: 4px; min-width: 190px;">
          <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 2px 0; color: #0f172a; line-height: 1.3;">${place.name}</h3>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">${place.district}, ${place.province}</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 11px; margin-bottom: 4px;">
              <span style="color: #64748b; font-weight: 500;">Aforo en vivo:</span>
              <strong style="color: #0f172a; font-family: monospace; font-size: 12px;">${place.current_occupancy} / ${place.max_capacity}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
              <span>Ocupación:</span>
              <strong style="color: ${haloColor}; font-weight: 700;">${place.occupancy_percentage.toFixed(0)}%</strong>
            </div>
          </div>

          <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background: ${haloColor}20; color: ${haloColor};">
            Estado: ${place.traffic_state}
          </div>
          ${
            place.is_alternative_destination
              ? '<div style="margin-top: 6px; font-size: 11px; color: #0d9488; font-weight: 600;">Destino de Descongestión Recomendado</div>'
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(place);
      });

      layerGroup.addLayer(marker);
    });
  }, [places, selectedPlaceId, onSelectPlace]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      lastCenteredPlaceIdRef.current = null;
      mapInstanceRef.current.flyTo(LIMA_CENTER, DEFAULT_ZOOM, { duration: 0.8, animate: !prefersReducedMotion() });
    }
  };

  return (
    <figure className={`relative w-full bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col ${className}`}>
      <figcaption className="z-10 flex min-h-[88px] flex-col justify-between gap-4 border-b border-slate-200 bg-white px-5 py-[18px] lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-teal-50 text-teal-600">
            <MapPinned aria-hidden="true" className="h-[19px] w-[19px]" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-bold leading-normal tracking-[-0.3px] text-slate-900">
              Mapa térmico de saturación
            </h2>
            <p className="text-xs font-medium leading-normal text-slate-500">
              Densidad de visitantes actualizada en tiempo real
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div aria-label="Leyenda del nivel de aforo" className="flex min-h-9 w-full flex-wrap items-center gap-x-[11px] gap-y-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 sm:w-auto">
            <span className="w-full whitespace-nowrap text-xs font-bold leading-normal tracking-[0.7px] text-slate-500 sm:w-auto">
              NIVEL DE AFORO
            </span>
            <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" />
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold leading-normal text-slate-600">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span>Libre</span>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold leading-normal text-slate-600">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <span>Moderado</span>
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold leading-normal text-slate-600">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
              <span>Saturado</span>
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetView}
            className="h-9 shrink-0 gap-[7px] rounded-[10px] border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 shadow-[0_1px_2px_#0F172A08] focus-visible:ring-teal-500"
            title="Centrar mapa en Lima Metropolitana"
          >
            <LocateFixed aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-teal-600" />
            <span>Centrar mapa</span>
          </Button>
        </div>
      </figcaption>

      {/* Contenedor del Mapa Leaflet */}
      <div className="relative">
      {(isLoading || !places.some((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude !== null && p.longitude !== null)) && (
        <div role="status" className="pointer-events-none absolute inset-x-4 top-4 z-10 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700 shadow-sm">
          {isLoading ? 'Cargando lugares del mapa…' : emptyMessage}
        </div>
      )}
      <div
        ref={mapContainerRef}
        className="w-full h-[460px] sm:h-[500px] min-h-[420px] z-0 relative bg-slate-100"
      />
      </div>
    </figure>
  );
};
