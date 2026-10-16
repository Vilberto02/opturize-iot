import React from 'react';
import { useViewModeStore, usePlacesStore } from '@/stores';
import { Header, Footer } from '@/components/layout';
import { TouristView, ManagerView } from '@/pages';
import { DataState } from '@/components/ui';

export const App: React.FC = () => {
  const { viewMode } = useViewModeStore();
  const { error, isLoading, fetchPlaces } = usePlacesStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-teal-500 selection:text-white">
      {/* Cabecera Principal */}
      <Header />
      <a href="#contenido-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3 focus:text-teal-800 focus:shadow-lg">Saltar al contenido</a>

      {/* Contenedor Principal Semántico */}
      <div id="contenido-principal" tabIndex={-1} className="flex-1 min-w-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner de Error Global si la API no responde */}
        {error && (
          <aside className="mb-6"><DataState error title="No pudimos actualizar la información"
            description="Puedes reintentar. Si ya había datos disponibles, seguiremos mostrándolos con la hora de su última actualización."
            onAction={() => fetchPlaces()} busy={isLoading} /></aside>
        )}

        {/* Vistas según Modo Seleccionado */}
        {viewMode === 'tourist' ? <TouristView /> : <ManagerView />}
      </div>

      {/* Pie de Página Semántico */}
      <Footer />
    </div>
  );
};

export default App;
