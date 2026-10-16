# Frontend OpTurize (SIT-Opt) — React, Vite, TypeScript, Zustand & Visx

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.0-orange.svg)](https://pnpm.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)
[![Visx](https://img.shields.io/badge/@visx-Airbnb-pink.svg)](https://airbnb.io/visx/)

Aplicación web cliente del sistema **OpTurize (SIT-Opt)** para monitoreo en vivo de aforo turístico, mapa de calor geoespacial de saturación, motor persuasivo de descongestión (Modelo de Fogg $B = MAP$) y centro de control remoto para microcontroladores ESP32 vía MQTT.

Desarrollado para el curso de **Internet de las Cosas (2026)** — **Facultad de Ingeniería de Sistemas e Informática (FISI) — UNMSM**.

---

## 🛠️ Stack Tecnológico

* **Gestor de Paquetes:** `pnpm` (versión 11+)
* **Framework & Compilador:** React 18 + Vite + TypeScript
* **Gestión de Estados Globales:** `zustand` (`usePlacesStore`, `useRecommendationsStore`, `useControlStore`, `useViewModeStore`)
* **Validación de Datos Backend:** `zod` para validación estricta en tiempo de ejecución
* **Conexión HTTP:** `fetch` nativo encapsulado con parsing tipado en `src/api/client.ts`
* **Gráficos Estadísticos:** `@visx` (Airbnb) para renderizado SVG nativo de alta precisión
* **Visualización Geoespacial:** `Leaflet` con cartografía CartoDB Positron y halos de densidad térmica
* **Estilos:** TailwindCSS con paleta semafórica (`traffic-green`, `traffic-yellow`, `traffic-red`)
* **Tipografía:** `DM Sans` de Google Fonts
* **Iconografía:** `lucide-react` (iconos vectoriales limpios, estricta política de **cero emojis**)
* **Semántica Web:** Estructura basada en `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<figure>`, `<footer>`, `<time>`, `<output>` para accesibilidad y reducción radical de `<div>`.

---

## 📂 Estructura de Directorios

```
src/frontend/
├── index.html                     # Entrada HTML con DM Sans y Leaflet CSS
├── package.json                   # Dependencias con pnpm
├── tsconfig.json                  # Configuración TypeScript estricta con alias @
├── vite.config.ts                 # Configuración de Vite con proxy hacia Django
├── tailwind.config.js             # Configuración de fuente DM Sans y colores semáforo
└── src/
    ├── api/                       # Capa de comunicación con Django REST API (fetch nativo)
    │   ├── client.ts              # Wrapper HTTP con validación Zod
    │   ├── placesApi.ts           # Endpoints /api/places/, /history/, /control/
    │   ├── recommendationsApi.ts  # Endpoints /api/recommendations/
    │   ├── healthApi.ts           # Endpoints /api/health/
    │   └── index.ts
    ├── types/                     # Esquemas Zod y tipos TypeScript inferidos
    │   ├── place.ts               # TouristPlace, TelemetryLog, CrowdAlert
    │   ├── recommendation.ts      # FoggRecommendation, FoggModel
    │   ├── control.ts             # DeviceControl
    │   ├── health.ts              # HealthCheck
    │   └── index.ts
    ├── stores/                    # Stores globales de Zustand
    │   ├── usePlacesStore.ts      # Atractivos, aforos, selección e histórico
    │   ├── useRecommendationsStore.ts # Recomendaciones Fogg activas
    │   ├── useControlStore.ts     # Comandos MQTT hacia el ESP32
    │   ├── useViewModeStore.ts    # Conmutador Modo Turista vs Modo Gestor
    │   └── index.ts
    ├── hooks/                     # Custom Hooks de React
    │   ├── useIntervalPolling.ts  # Polling automático cada 5 segundos
    │   ├── usePlaces.ts           # Hook de consulta, filtrado y KPIs globales
    │   ├── useFoggRecommendations.ts # Hook del motor de persuasión
    │   └── index.ts
    ├── components/                # Componentes semánticos (shadcn style)
    │   ├── ui/                    # Button, Badge, Card, Progress
    │   ├── layout/                # Header, Footer
    │   ├── places/                # PlaceCard, TrafficBadge, BarrierBadge, ClimateWidget
    │   ├── charts/                # Gráficos Visx (Airbnb):
    │   │   ├── LiveOccupancyChart.tsx       # Curva de aforo con umbral rojo al 100%
    │   │   ├── HourlyHeatmapChart.tsx      # Matriz horaria Días vs Horas
    │   │   └── CapacityComparisonChart.tsx # Comparativa de capacidades de red
    │   ├── map/                   # Mapa de Calor Geoespacial:
    │   │   └── HeatmapView.tsx              # Mapa interactivo Leaflet
    │   ├── fogg/                  # FoggBanner, FoggRecommendationCard
    │   └── control/               # DeviceControlDialog (Control remoto MQTT)
    ├── pages/                     # Vistas Principales (Command Center Dual)
    │   ├── TouristView.tsx        # Vista Turista: Búsqueda, mapa térmico y rutas alternas
    │   └── ManagerView.tsx        # Vista Gestor: KPIs, curvas Visx y control ESP32
    ├── App.tsx                    # Componente raíz con layout y conmutador
    ├── main.tsx                   # Punto de arranque React 18
    └── index.css                  # Estilos globales y capas de Tailwind
```

---

## 🚀 Puesta en Marcha

### 1. Instalar dependencias con `pnpm`
```powershell
cd src/frontend
pnpm install
```

### 2. Iniciar el servidor de desarrollo
```powershell
pnpm run dev
```
La aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

### 3. Compilar para Producción
```powershell
pnpm run build
```
Ejecuta la comprobación estricta de tipos de TypeScript (`tsc`) y genera los archivos optimizados en `dist/`.

---

## 🧭 Vistas y Funcionalidades de la Interfaz

1. **Modo Turista Explorador:**
   * **Banner Persuasivo Fogg:** Notifica proactivamente cuando un sitio principal (ej. Huaca Pucllana) alcanza $\ge 70\%$ de capacidad, sugiriendo el desvío hacia Huaca Huallamarca o Mateo Salado.
   * **Filtros Dinámicos:** Búsqueda por texto, categoría (Arqueológico, Natural, Museo, Histórico) y estado del semáforo.
   * **Mapa Térmico Geoespacial:** Halos térmicos en tiempo real sobre Lima Metropolitana.
   * **Tarjetas Fogg ($B = MAP$):** Desglose de Motivación, Habilidad (distancia y tiempo de viaje) y Disparador con llamado a la acción.
2. **Modo Gestor / Administrador IoT:**
   * **Tarjetas KPI de Red:** Aforo global activo, tasa media de ocupación, recuento de sitios críticos y sitios con fluidez.
   * **Curva de Aforo en Vivo (`LiveOccupancyChart` con `@visx`):** Área suavizada con trazo punteado de límite máximo permisible.
   * **Comparativa de Capacidad (`CapacityComparisonChart` con `@visx`):** Barras apiladas de aforo ocupado vs. vacante.
   * **Matriz Horaria de Saturación (`HourlyHeatmapChart` con `@visx`):** Mapa de calor de afluencia por día y hora.
   * **Consola de Control Remoto (`DeviceControlDialog`):** Envío de comandos MQTT hacia el ESP32 para resetear aforo, calibrar capacidad máxima y forzar apertura/bloqueo de talanquera.
