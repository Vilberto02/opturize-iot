import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  LayoutGrid,
  Layers,
  ListFilter,
  Landmark,
  CircleDotDashed,
  ArrowUpRight,
  RadioTower,
} from 'lucide-react';
import limaTouristMap from '@/assets/lima-tourist-map.svg';
import { usePlaces, useFoggRecommendations } from '@/hooks';
import { PlaceCard } from '@/components/places';
import { HeatmapView } from '@/components/map';
import { FoggBanner, FoggRecommendationCard } from '@/components/fogg';
import {
  Button,
  Badge,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui';
import { type TouristPlace } from '@/types';
import { DataState, LoadingCards } from '@/components/ui';
import { scrollToSection } from '@/lib/motion';

export const TouristView: React.FC = () => {
  const {
    places,
    allPlaces,
    selectedPlace,
    searchQuery,
    filterCategory,
    filterState,
    selectPlace,
    setSearchQuery,
    setFilterCategory,
    setFilterState,
    clearFilters,
    hasLoaded,
    error,
  } = usePlaces();

  const { recommendations, activeTriggers, filterByOrigin, isLoading: recommendationsLoading,
    hasLoaded: recommendationsLoaded, error: recommendationsError, refreshRecommendations } = useFoggRecommendations();
  const hasFilters = Boolean(searchQuery || filterCategory || filterState);

  // Opciones dinámicas según datos obtenidos del backend (allPlaces)
  const categories = useMemo(() => {
    const set = new Set(allPlaces.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [allPlaces]);

  const trafficStates = useMemo(() => {
    const set = new Set(allPlaces.map((p) => p.traffic_state).filter(Boolean));
    return Array.from(set).sort();
  }, [allPlaces]);

  // 'both': Mapa y tarjetas visibles simultáneamente (protagónico)
  // 'catalog': Únicamente lista de tarjetas
  // 'map': Únicamente mapa interactivo
  const [viewMode, setViewMode] = useState<'both' | 'catalog' | 'map'>('both');

  const topTrigger = activeTriggers.length > 0 ? activeTriggers[0] : null;
  const mappedPlacesCount = allPlaces.filter((place) =>
    typeof place.latitude === 'number' && Number.isFinite(place.latitude) &&
    typeof place.longitude === 'number' && Number.isFinite(place.longitude)
  ).length;

  const handleExploreFogg = (place: TouristPlace) => {
    selectPlace(place.id);
    filterByOrigin(place.id);
    scrollToSection('seccion-recomendaciones');
  };

  const handleSelectFromRecommendation = (targetId: number) => {
    selectPlace(targetId);
    clearFilters();
    if (viewMode === 'catalog') {
      setViewMode('both');
    }
    scrollToSection('mapa-en-vivo');
  };

  return (
    <main className="space-y-8 animate-in fade-in duration-300">
      {/* Banner Persuasivo del Modelo de Fogg (si hay destino saturado) */}
      {topTrigger && (
        <FoggBanner
          recommendation={topTrigger}
          onExplore={() => {
            selectPlace(topTrigger.origin_place.id);
            filterByOrigin(topTrigger.origin_place.id);
            scrollToSection('seccion-recomendaciones');
          }}
        />
      )}

      {/* Hero / Encabezado Turístico */}
      <section aria-labelledby="tourist-hero-title" className="relative isolate overflow-hidden rounded-3xl bg-[linear-gradient(93.787deg,#0F172A_2.273%,#123B3B_57.636%,#0D9488_97.727%)] text-white shadow-[0_14px_28px_#0F172A21,0_3px_6px_#0F172A12]">
        <div aria-hidden="true" className="pointer-events-none absolute right-8 top-4 h-[220px] w-[220px] rounded-full bg-teal-300/15 blur-[9px]" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-2 right-12 h-24 w-24 rounded-full bg-sky-400/10 blur-lg" />
        <div className="relative z-10 flex min-h-[272px] flex-col items-start justify-center gap-[13px] p-6 sm:p-8 lg:w-[58%]">
          <Badge className="gap-[7px] border border-white/[0.14] bg-white/[0.08] px-2.5 py-1.5 text-xs font-bold leading-normal tracking-[0.9px] text-teal-100 shadow-none">
            <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-teal-300" />
            LIMA EN TIEMPO REAL
          </Badge>
          <h2 id="tourist-hero-title" className="text-[30px] font-bold leading-[1.08] tracking-[-0.8px] sm:text-[38px] sm:leading-[41px]">
            Explora más. Espera menos.
          </h2>
          <p className="max-w-[585px] text-sm font-normal leading-[21px] text-slate-300">
            Visualiza la afluencia en tiempo real y descubre rutas culturales más tranquilas para
            disfrutar Lima a tu ritmo.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (viewMode === 'catalog') setViewMode('both');
                scrollToSection('mapa-en-vivo');
              }}
              className="h-[42px] gap-2 rounded-[11px] border-0 bg-white px-[15px] text-sm font-bold text-slate-900 shadow-[0_4px_10px_#02061733] focus-visible:ring-teal-300"
            >
              <span>Ver mapa en vivo</span>
              <ArrowUpRight aria-hidden="true" className="h-[15px] w-[15px] shrink-0 text-teal-600" />
            </Button>
            <span className="flex items-center gap-[7px] text-xs font-medium text-teal-100">
              <RadioTower aria-hidden="true" className="h-[15px] w-[15px] shrink-0 text-teal-300" />
              {allPlaces.length} {allPlaces.length === 1 ? 'sitio monitoreado' : 'sitios monitoreados'}
            </span>
          </div>
        </div>
        <figure className="pointer-events-none absolute inset-y-0 right-0 hidden w-[45.15%] overflow-hidden lg:block">
          <img src={limaTouristMap} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <figcaption className="absolute bottom-[23px] left-1/2 flex h-8 -translate-x-1/2 items-center gap-[7px] whitespace-nowrap rounded-[9px] border border-white/[0.16] bg-slate-900/65 px-2.5 text-xs font-bold backdrop-blur-[5px]">
            <MapPin aria-hidden="true" className="h-[13px] w-[13px] shrink-0 text-teal-300" />
            {mappedPlacesCount} {mappedPlacesCount === 1 ? 'lugar activo' : 'lugares activos'}
          </figcaption>
        </figure>
      </section>

      {/* Barra de Búsqueda, Filtros y Selector de Modalidad */}
      <section aria-label="Búsqueda, filtros y modalidad de vista" className="surface-panel flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Campo de Búsqueda con Input de Shadcn */}
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              aria-label="Buscar atractivos"
              placeholder="Buscar por atractivo, distrito o ubicación…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl border-slate-300 bg-white pl-[41px] pr-3.5 text-base font-medium placeholder:text-slate-500 focus-visible:ring-teal-600"
            />
          </div>

          {/* Selector de Perspectiva: Combinada / Solo Tarjetas / Solo Mapa */}
          <div role="group" aria-label="Modalidad de vista" className="flex min-h-[52px] w-full shrink-0 items-center gap-1 rounded-xl bg-slate-100 p-1 md:w-[348px]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("both")}
              aria-pressed={viewMode === "both"}
              className={`h-11 min-w-0 flex-1 gap-[7px] whitespace-nowrap rounded-lg px-[11px] transition-colors focus-visible:ring-teal-500 ${
                viewMode === "both"
                  ? "bg-white font-bold text-teal-700 shadow-[0_1px_3px_#0F172A14] hover:bg-white hover:text-teal-700"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
              }`}
              title="Vista completa con mapa térmico y tarjetas de atractivos"
            >
              <Layers aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${viewMode === "both" ? "text-teal-600" : "text-slate-500"}`} />
              <span>Completa</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("catalog")}
              aria-pressed={viewMode === "catalog"}
              className={`h-11 min-w-0 flex-1 gap-[7px] whitespace-nowrap rounded-lg px-[11px] transition-colors focus-visible:ring-teal-500 ${
                viewMode === "catalog"
                  ? "bg-white font-bold text-teal-700 shadow-[0_1px_3px_#0F172A14] hover:bg-white hover:text-teal-700"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
              }`}
              title="Mostrar únicamente catálogo de atractivos"
            >
              <LayoutGrid aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${viewMode === "catalog" ? "text-teal-600" : "text-slate-500"}`} />
              <span>Catálogo</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("map")}
              aria-pressed={viewMode === "map"}
              className={`h-11 min-w-0 flex-1 gap-[7px] whitespace-nowrap rounded-lg px-[11px] transition-colors focus-visible:ring-teal-500 ${
                viewMode === "map"
                  ? "bg-white font-bold text-teal-700 shadow-[0_1px_3px_#0F172A14] hover:bg-white hover:text-teal-700"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
              }`}
              title="Mostrar únicamente mapa de calor térmico"
            >
              <MapPin aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 ${viewMode === "map" ? "text-teal-600" : "text-slate-500"}`} />
              <span>Solo mapa</span>
            </Button>
          </div>
        </div>

        {/* Controles de Filtro con Selects de Shadcn */}
        <div className="flex flex-col gap-2.5 rounded-[11px] border border-[#DCE3EA] bg-white px-2.5 py-2 md:flex-row md:items-center">
          <div className="flex shrink-0 items-center gap-2.5 md:w-[172px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-teal-50">
              <ListFilter aria-hidden="true" className="h-[15px] w-[15px] text-teal-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-normal text-slate-900">Filtros</span>
              <span className="text-xs font-medium leading-normal text-slate-500">Refina resultados</span>
            </div>
          </div>
          <div aria-hidden="true" className="hidden h-7 w-px shrink-0 bg-slate-200 md:block" />

          {/* Filtro por Categoría */}
          <Select
            value={filterCategory || "ALL"}
            onValueChange={(val) =>
              setFilterCategory(val === "ALL" ? null : val)
            }
          >
            <SelectTrigger aria-label="Filtrar por categoría" className="h-10 min-w-0 gap-2 rounded-[9px] border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 focus:ring-teal-500 md:w-0 md:flex-1 [&>span]:flex [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:text-slate-400 [&>svg]:opacity-100">
              <span className="flex min-w-0 items-center gap-2 [&>span]:truncate">
                <Landmark aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <SelectValue placeholder="Todas las categorías" />
              </span>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="ALL">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por Semáforo */}
          <Select
            value={filterState || "ALL"}
            onValueChange={(val) => setFilterState(val === "ALL" ? null : val)}
          >
            <SelectTrigger aria-label="Filtrar por estado" className="h-10 min-w-0 gap-2 rounded-[9px] border-slate-300 bg-slate-50 text-sm font-semibold text-slate-700 focus:ring-teal-500 md:w-0 md:flex-1 [&>span]:flex [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0 [&>svg]:text-slate-400 [&>svg]:opacity-100">
              <span className="flex min-w-0 items-center gap-2 [&>span]:truncate">
                <CircleDotDashed aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <SelectValue placeholder="Todos los estados" />
              </span>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {trafficStates.map((st) => (
                <SelectItem key={st} value={st}>
                  {st === "VERDE"
                    ? "Acceso Libre (Verde)"
                    : st === "AMARILLO"
                      ? "Aforo Moderado (Amarillo)"
                      : st === "ROJO"
                        ? "Saturado (Rojo)"
                        : st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-100 pt-2">
          <p role="status" className="text-sm text-slate-600">
            {!hasLoaded ? (error ? 'Información no disponible' : 'Cargando destinos…') : `${places.length} de ${allPlaces.length} destinos · filtros aplicados al mapa y al catálogo`}
          </p>
          {hasFilters && <Button variant="ghost" onClick={clearFilters} className="text-sm text-teal-700">Limpiar filtros</Button>}
        </div>
      </section>

      {/* 1. Sección del Mapa Térmico Protagónico (Visible en modo 'both' o 'map') */}
      {(viewMode === "both" || viewMode === "map") && (
        <section id="mapa-en-vivo" className="scroll-mt-36 space-y-2 animate-in fade-in duration-300 sm:scroll-mt-24">
          <HeatmapView
            places={places}
            isLoading={!hasLoaded && !error}
            emptyMessage={hasFilters ? 'No hay lugares en el mapa con estos filtros.' : error ? 'No pudimos cargar los lugares del mapa.' : 'No hay lugares con coordenadas disponibles.'}
            selectedPlaceId={selectedPlace?.id}
            onSelectPlace={(p) => selectPlace(p.id)}
          />
        </section>
      )}

      {/* 2. Sección del Catálogo de Atractivos (Visible en modo 'both' o 'catalog') */}
      {(viewMode === "both" || viewMode === "catalog") && (
        <section className="space-y-4">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Atractivos Disponibles en Lima ({places.length})
              </h3>
              <p className="text-sm text-slate-500">
                Información en vivo transmitida por sensores y nodos IoT
              </p>
            </div>
            {selectedPlace && (
              <span className="text-sm text-teal-700 bg-teal-50 border border-teal-200 px-4 py-1 rounded-full">
                Seleccionado: <strong>{selectedPlace.name}</strong>
              </span>
            )}
          </header>

          <div className="w-full">
            {!hasLoaded && !error ? <LoadingCards /> : places.length > 0 ? (
              <Carousel
                opts={{
                  loop: true,
                  align: "start",
                }}
                className="w-full"
                aria-label="Atractivos disponibles en Lima"
              >
                <CarouselContent className="ml-0 gap-4 py-2">
                  {places.map((place) => (
                    <CarouselItem
                      key={place.id}
                      className="pl-0 basis-full md:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]"
                    >
                      <PlaceCard
                        place={place}
                        isSelected={place.id === selectedPlace?.id}
                        onSelect={(p) => selectPlace(p.id)}
                        onViewFogg={handleExploreFogg}
                        showControlAction={false}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <CarouselPrevious className="static translate-y-0" />
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
            ) : (
              <DataState title={error ? 'Atractivos no disponibles' : hasFilters ? 'No encontramos atractivos con estos filtros' : 'Aún no hay destinos disponibles'}
                description={hasFilters ? 'Prueba otro distrito, categoría o estado de aforo.' : 'Los destinos aparecerán cuando estén disponibles.'}
                actionLabel="Limpiar filtros" onAction={hasFilters ? clearFilters : undefined} />
            )}
          </div>
        </section>
      )}

      {/* 3. Sección del Motor de Persuasión y Recomendación Fogg (B = MAP) */}
      <section id="seccion-recomendaciones" className="scroll-mt-36 pt-6 space-y-4 sm:scroll-mt-28">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>
                Rutas alternativas persuasivas (Modelo de Fogg: B = MAP)
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Incentivos calculados en tiempo real para descongestionar sitios
              saturados
            </p>
          </div>

          <span className="text-sm font-medium text-slate-400 self-start sm:self-auto">
            {recommendations.length} alternativas activas
          </span>
        </header>

        {recommendationsError && <DataState error title="No pudimos actualizar las alternativas"
          description="Reintenta para consultar las rutas disponibles para este origen." onAction={refreshRecommendations} busy={recommendationsLoading} />}
        {!recommendationsLoaded && recommendationsLoading ? <LoadingCards /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.length > 0 ? (
            recommendations.map((item, index) => (
              <FoggRecommendationCard
                key={`${item.origin_place.id}-${item.recommended_place.id}-${index}`}
                item={item}
                onSelectTarget={handleSelectFromRecommendation}
              />
            ))
          ) : !recommendationsError && recommendationsLoaded ? (
            <div className="col-span-full"><DataState title="Sin alternativas disponibles para este origen"
              description="Selecciona otro atractivo para consultar sus recomendaciones de visita." /></div>
          ) : null}
        </div>}
      </section>
    </main>
  );
};
