// src/services/sessionTracker/activityMonitor.ts

// --- State ---
let lastMousePosition = { x: 0, y: 0 };
let lastActivityTime = 0;
let activityInterval: ReturnType<typeof setInterval> | null = null;
let isMonitoring = false;

// --- Constants ---
const ACTIVITY_UPDATE_INTERVAL = 2000; // Frecuencia de envío de eventos en ms
const INACTIVITY_THRESHOLD = 3000;     // Tiempo sin actividad para dejar de enviar eventos en ms

// --- Event Handlers ---

/**
 * Actualiza la hora de la última actividad y la posición del mouse.
 */
function handleMouseMove(event: MouseEvent): void {
  lastActivityTime = Date.now();
  lastMousePosition = { x: event.clientX, y: event.clientY };
}

/**
 * Actualiza la hora de la última actividad al hacer scroll.
 */
function handleScroll(): void {
  lastActivityTime = Date.now();
}

// --- Public API ---

/**
 * Inicia el monitoreo de la actividad del usuario.
 *
 * @param trackEventFunction - La función para enviar eventos (de sessionManager).
 * @param getSessionStartTime - Una función que devuelve el timestamp de inicio de la sesión.
 * @param getVisibleScrollZones - Una función que devuelve las zonas de scroll visibles actualmente.
 * @param getMaxScroll - Una función que devuelve el máximo scroll alcanzado.
 */
export function startActivityMonitoring(
  trackEventFunction: (eventType: string, eventData: Record<string, any>) => void,
  getSessionStartTime: () => number,
  getVisibleScrollZones: () => string[],
  getMaxScroll: () => number
): void {
  if (isMonitoring || typeof window === 'undefined') return;

  // Reiniciar estado y añadir listeners
  lastActivityTime = Date.now();
  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });

  activityInterval = setInterval(() => {
    const now = Date.now();
    // Solo enviar evento si el usuario ha estado activo recientemente
    if (now - lastActivityTime < INACTIVITY_THRESHOLD) {
      const eventData = {
        timeOnPage: (now - getSessionStartTime()) / 1000,
        scrollPercentage: getMaxScroll(),
        visibleScrollZones: getVisibleScrollZones(),
        mousePosition: lastMousePosition,
      };
      trackEventFunction('activity_update', eventData);
    }
  }, ACTIVITY_UPDATE_INTERVAL);

  isMonitoring = true;
}

/**
 * Detiene el monitoreo de la actividad del usuario y limpia los listeners.
 */
export function stopActivityMonitoring(): void {
  if (!isMonitoring || typeof window === 'undefined') return;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('scroll', handleScroll);

  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }

  isMonitoring = false;
}
