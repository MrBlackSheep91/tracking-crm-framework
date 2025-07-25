// src/services/sessionTracker/scrollTracker.ts

// --- State ---

let scrollAttentionMap: Record<string, number> = {};
let lastVisibleZones: string[] = [];
let lastUpdateTime = 0;
let scrollInterval: ReturnType<typeof setInterval> | null = null;

// --- Constants ---
const SCROLL_ZONE_SIZE = 10; // Divide la página en zonas del 10%
const UPDATE_INTERVAL = 1000; // Actualiza el tiempo cada segundo

// --- Core Logic ---

/**
 * Calcula qué zonas de scroll (en incrementos de 10%) están actualmente visibles.
 * @returns Un array de strings representando las zonas visibles (e.g., ['0-10', '10-20']).
 */
export function getVisibleScrollZones(): string[] {
  if (typeof window === 'undefined') return [];

  const viewportHeight = window.innerHeight;
  const scrollTop = window.scrollY;
  const totalHeight = document.documentElement.scrollHeight;
  
  if (totalHeight <= viewportHeight) {
    return ['0-100']; // La página completa es visible
  }

  const zones = new Set<string>();
  const startPercent = (scrollTop / totalHeight) * 100;
  const endPercent = ((scrollTop + viewportHeight) / totalHeight) * 100;

  const startZone = Math.floor(startPercent / SCROLL_ZONE_SIZE);
  const endZone = Math.floor(endPercent / SCROLL_ZONE_SIZE);

  for (let i = startZone; i <= endZone; i++) {
    const zoneStart = i * SCROLL_ZONE_SIZE;
    const zoneEnd = zoneStart + SCROLL_ZONE_SIZE;
    zones.add(`${zoneStart}-${zoneEnd}`);
  }

  return Array.from(zones);
}

/**
 * Actualiza el mapa de atención de scroll, añadiendo tiempo a las zonas visibles.
 */
function updateAttentionMap(): void {
  const now = Date.now();
  const visibleZones = getVisibleScrollZones();
  
  // Si hay un tiempo de actualización, calcula el delta
  if (lastUpdateTime > 0) {
    const deltaTime = (now - lastUpdateTime) / 1000; // en segundos
    lastVisibleZones.forEach(zone => {
      scrollAttentionMap[zone] = (scrollAttentionMap[zone] || 0) + deltaTime;
    });
  }

  lastVisibleZones = visibleZones;
  lastUpdateTime = now;
}

// --- Public API ---

/**
 * Inicia el seguimiento del mapa de atención de scroll.
 */
export function startScrollTracking(): void {
  if (typeof window === 'undefined' || scrollInterval) return;
  
  scrollAttentionMap = {};
  lastVisibleZones = [];
  lastUpdateTime = Date.now(); // Iniciar el tiempo inmediatamente

  // Llama una vez para registrar el estado inicial
  updateAttentionMap();
  
  // Establece un intervalo para actualizar continuamente el tiempo en las zonas visibles
  scrollInterval = setInterval(updateAttentionMap, UPDATE_INTERVAL);
}

/**
 * Detiene el seguimiento del mapa de atención de scroll.
 */
export function stopScrollTracking(): void {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
  // Registra el último fragmento de tiempo antes de parar
  updateAttentionMap();
  lastUpdateTime = 0;
}

/**
 * Devuelve el mapa de atención de scroll acumulado.
 * @returns Un objeto donde las claves son las zonas y los valores son los segundos de atención.
 */
export function getScrollAttentionMap(): Record<string, number> {
  // Realiza una última actualización para capturar el tiempo final antes de devolver
  updateAttentionMap();
  
  // Redondea los valores para que sean más limpios
  const roundedMap: Record<string, number> = {};
  for (const zone in scrollAttentionMap) {
    roundedMap[zone] = Math.round(scrollAttentionMap[zone]);
  }
  return roundedMap;
}

/**
 * Calcula el porcentaje máximo de scroll alcanzado, derivado del mapa de atención.
 * @returns El porcentaje máximo de scroll (e.g., 90).
 */
export function getMaxScrollPercentage(): number {
  const zones = Object.keys(scrollAttentionMap);
  if (zones.length === 0) return 0;

  let maxZoneEnd = 0;
  zones.forEach(zone => {
    // Maneja el caso especial '0-100'
    if (zone === '0-100') {
        maxZoneEnd = 100;
        return;
    }
    const zoneEnd = parseInt(zone.split('-')[1], 10);
    if (zoneEnd > maxZoneEnd) {
      maxZoneEnd = zoneEnd;
    }
  });

  return maxZoneEnd;
}
