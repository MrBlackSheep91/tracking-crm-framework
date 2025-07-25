/**
 * Punto de entrada principal para el sistema de tracking server-side
 * Este módulo conecta el tracking de cliente con el servidor
 */

import metaApi from './metaConversionsApi';
import type { VisitorData, UTMData, EventData } from './types';

/**
 * Envía un evento a todas las plataformas de tracking server-side configuradas
 * Actualmente soporta: Meta Conversions API
 */
export async function trackServerEvent(
  eventName: string, 
  visitorData: VisitorData, 
  utmData: UTMData,
  eventData: Partial<EventData> = {}
): Promise<any[]> {
  const results = [];
  
  // 1. Meta Conversions API
  try {
    const metaResult = await metaApi.sendServerEvent({
      eventName,
      userData: {
        external_id: String(visitorData.id || visitorData.fingerprint || ''), // Forzar conversión a string para evitar problemas con UUID
        client_ip_address: visitorData.clientIP || '',
        client_user_agent: visitorData.browser || '',
        email: visitorData.email || '',
        phone: visitorData.phone || ''
      },
      customData: {
        ...utmData,
        ...eventData,
        page_url: eventData.url || (typeof window !== 'undefined' ? window.location.href : ''),
        content_id: eventData.contentId || 'default_content',
        content_name: eventData.contentName || 'Recetas Naturales para Perros'
      }
    });
    
    results.push({
      platform: 'meta',
      success: !metaResult.error,
      ...metaResult
    });
  } catch (error) {
    console.error('Error al enviar evento Meta CAPI:', error);
    results.push({
      platform: 'meta',
      success: false,
      error: String(error)
    });
  }
  
  // 2. TikTok Events API (para futura implementación)
  // TODO: Implementar TikTok Events API cuando esté disponible
  
  return results;
}

/**
 * Envía un evento PageView a todas las plataformas
 */
export async function trackServerPageView(
  visitorData: VisitorData, 
  utmData: UTMData,
  url?: string
): Promise<any[]> {
  return trackServerEvent('PageView', visitorData, utmData, { url });
}

/**
 * Envía un evento ViewContent a todas las plataformas
 */
export async function trackServerViewContent(
  visitorData: VisitorData, 
  utmData: UTMData,
  contentId: string,
  contentName: string = 'Recetas Naturales para Perros'
): Promise<any[]> {
  return trackServerEvent('ViewContent', visitorData, utmData, { 
    contentId,
    contentName
  });
}

/**
 * Envía un evento Purchase a todas las plataformas
 */
export async function trackServerPurchase(
  visitorData: VisitorData, 
  utmData: UTMData,
  value: number,
  currency: string = 'USD',
  orderId?: string,
  contentId?: string
): Promise<any[]> {
  return trackServerEvent('Purchase', visitorData, utmData, {
    value,
    currency,
    contentId: contentId || 'product_cookbook',
    contentName: 'Recetas Naturales para Perros',
    metadata: { 
      order_id: orderId || `order_${Date.now()}`
    }
  });
}

// Exportar funciones específicas y también el API de Meta directamente
// para casos donde se necesite más control
export {
  metaApi
};

export default {
  trackServerEvent,
  trackServerPageView,
  trackServerViewContent,
  trackServerPurchase,
  metaApi
};
