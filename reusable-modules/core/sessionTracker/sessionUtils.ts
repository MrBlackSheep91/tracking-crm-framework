import { v4 as uuidv4 } from 'uuid';

/**
 * Utilidades para el manejo de sesiones
 */

// Constantes
const VISITOR_ID_KEY = 'visitorId'; // Cambiado para ser consistente

// Helper para validar formato UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
const SESSION_ID_KEY = 'session_id';

/**
 * Obtiene o crea un ID único para el visitante
 * Almacenado en localStorage para persistencia entre sesiones
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server-side-uuid'; // Return a placeholder for SSR
  
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    
    // Validar si el visitorId existente es un UUID válido
    if (visitorId && !isValidUUID(visitorId)) {
      console.warn(`[Session] Found invalid visitor ID format: ${visitorId}. Generating a new one.`);
      visitorId = null; // Forzar la generación de un nuevo ID
    }

    if (!visitorId) {
      // Generar un UUID estándar que la base de datos espera.
      visitorId = uuidv4();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      console.log(`[Session] Created new visitor ID (UUID): ${visitorId}`);
    } else {
      console.log(`[Session] Using existing visitor ID: ${visitorId}`);
    }
    
    return visitorId;
  } catch (error) {
    console.error('[Session] Error getting/creating visitor ID:', error);
    // En caso de error (ej. localStorage bloqueado), generar un UUID temporal sin guardarlo.
    return uuidv4();
  }
}

/**
 * Obtiene el ID de sesión actual o genera uno nuevo
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    } catch (e) {
      console.warn('No se pudo guardar el ID de sesión en sessionStorage', e);
    }
  }
  
  return sessionId;
}

/**
 * Obtiene los parámetros UTM de la URL actual
 */
export function getUTMParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  // Parámetros UTM estándar
  const utmKeys = ['source', 'medium', 'campaign', 'term', 'content'];
  
  utmKeys.forEach(key => {
    const value = params.get(`utm_${key}`);
    if (value) {
      utmParams[key] = value;
    }
  });
  
  return utmParams;
}

/**
 * Obtiene el porcentaje de desplazamiento actual de la página
 */
export function getCurrentScrollPercentage(): number {
  if (typeof window === 'undefined') return 0;
  
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );
  
  if (documentHeight <= windowHeight) return 100;
  
  const maxScroll = documentHeight - windowHeight;
  return Math.round((scrollPosition / maxScroll) * 100);
}
