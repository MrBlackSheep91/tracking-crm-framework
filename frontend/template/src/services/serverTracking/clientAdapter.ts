/**
 * Adaptador para usar el tracking server-side desde el cliente
 * Este módulo permite que la aplicación frontend pueda enviar eventos
 * al servidor de tracking de forma transparente
 */

// Imports dinámicos para evitar errores en desarrollo
let utmUtils: any;
let getUtmParams: ((forceRefresh?: boolean) => Record<string, string>);

// Flag para detectar si estamos en desarrollo o producción
const IS_DEVELOPMENT = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Importamos tipos, si están disponibles
import type { VisitorData } from './types';

// Función para inicializar módulos necesarios de forma segura
async function initModules() {
  try {
    // Intentar importar getUtmParams si no está disponible aún
    if (!getUtmParams) {
      // Importar sin extensión .ts para compatibilidad con Vite
      utmUtils = await import('../../utils/urlUtils');
      getUtmParams = utmUtils.getUtmParams as ((forceRefresh?: boolean) => Record<string, string>);
    }
  } catch (e) {
    console.warn('⚠️ [Server Tracking] No se pudo cargar el módulo de UTM:', e);
    // Función fallback
    getUtmParams = () => ({});
  }
}

// Endpoint para envío de eventos al backend (ajustar según configuración)
const TRACKING_ENDPOINT = IS_DEVELOPMENT ? 
  'https://nat-pets.com/api/tracking' : // Desarrollo (simular)
  '/api/tracking';                       // Producción

/**
 * Obtiene los datos del visitante actual a partir del localStorage
 * y otros datos disponibles en el cliente
 */
export function getCurrentVisitorData(): VisitorData {
  try {
    // Intentar obtener fingerprint de localStorage
    const fingerprint = localStorage.getItem('visitorFingerprint') || '';
    const sessionId = localStorage.getItem('sessionId') || '';

    return {
      id: sessionId || `session_${Date.now()}`, // Aseguramos que siempre haya un ID
      fingerprint: fingerprint || `fp_${Math.random().toString(36).substr(2, 9)}`,
      clientIP: '', // Se completará en el servidor
      browser: navigator.userAgent,
      deviceType: detectDeviceType(),
      language: navigator.language
    };
  } catch (e) {
    console.error('Error al obtener datos del visitante:', e);
    // Generar datos fallback para que no falle el tracking
    return {
      id: `session_${Date.now()}`,
      fingerprint: `fp_${Math.random().toString(36).substr(2, 9)}`,
      browser: navigator.userAgent || 'unknown',
      deviceType: 'unknown',
      language: 'es'
    };
  }
}

/**
 * Detecta el tipo de dispositivo basado en el user agent
 */
function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Envía un evento al backend para procesamiento server-side
 */
export async function sendServerEvent(
  eventName: string,
  additionalData: Record<string, any> = {}
): Promise<any> {
  try {
    await initModules(); // Asegurar que los módulos estén disponibles
    
    // Obtener datos del visitante y UTMs
    const visitorData = getCurrentVisitorData();
    // Asegurar que no es undefined antes de llamar
    const utmParams = typeof getUtmParams === 'function' ? getUtmParams() : {};

    // Construir payload
    const payload = {
      eventName,
      visitorData,
      utmData: utmParams,
      url: window.location.href,
      timestamp: Date.now(),
      ...additionalData
    };

    // En desarrollo, simulamos la respuesta sin realizar fetch real
    if (IS_DEVELOPMENT) {
      console.log(`🧪 [Server Tracking] Simulando evento ${eventName} en desarrollo:`, payload);
      return {
        success: true,
        mock: true,
        eventName,
        timestamp: Date.now()
      };
    }
    
    // En producción, realizamos el fetch real
    try {
      const response = await fetch(TRACKING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error al enviar evento: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [Server Tracking] Evento ${eventName} enviado correctamente`);
      return data;
    } catch (fetchError: unknown) {
      console.warn(`⚠️ [Server Tracking] Error al hacer fetch: ${fetchError}`);
      // Devolver respuesta simulada para evitar errores en cascada
      return { 
        success: false, 
        mock: true,
        error: fetchError instanceof Error ? fetchError.toString() : String(fetchError) 
      };
    }
  } catch (error: unknown) {
    console.error(`❌ [Server Tracking] Error al enviar evento ${eventName}:`, error);
    return { error: error instanceof Error ? error.toString() : String(error) };
  }
}

/**
 * Envía un evento PageView al servidor
 */
export async function trackServerPageView(): Promise<any> {
  try {
    return await sendServerEvent('PageView');
  } catch (e) {
    console.warn('⚠️ [Server Tracking] Error en PageView:', e);
    return { success: false, mock: true };
  }
}

/**
 * Envía un evento ViewContent al servidor
 */
export async function trackServerViewContent(
  contentId: string = 'cookbook',
  contentName: string = 'Recetas Naturales para Perros'
): Promise<any> {
  try {
    return await sendServerEvent('ViewContent', { 
      contentId, 
      contentName 
    });
  } catch (e) {
    console.warn('⚠️ [Server Tracking] Error en ViewContent:', e);
    return { success: false, mock: true };
  }
}

/**
 * Envía un evento Purchase al servidor
 */
export async function trackServerPurchase(
  value: number = 15,
  currency: string = 'USD',
  contentId: string = 'cookbook'
): Promise<any> {
  try {
    return await sendServerEvent('Purchase', {
      value,
      currency,
      contentId,
      orderId: `order_${Date.now()}`
    });
  } catch (e) {
    console.warn('⚠️ [Server Tracking] Error en Purchase:', e);
    return { success: false, mock: true };
  }
}

// Inicializar módulos al cargar el adaptador
initModules().catch(e => console.warn('⚠️ [Server Tracking] Error al inicializar módulos:', e));

export default {
  getCurrentVisitorData,
  sendServerEvent,
  trackServerPageView,
  trackServerViewContent,
  trackServerPurchase,
  // Utilidades para debugging
  isDevelopment: IS_DEVELOPMENT
};
