/**
 * enhancedTracking.ts
 * Servicio mejorado para el tracking de visitantes y eventos
 * Optimizado para trabajar con el schema de VisitorEvent
 */

// Tipos para los datos de tracking
export interface VisitorData {
  fingerprint?: string;
  businessId: string;
  sessionId?: string;
  deviceInfo?: {
    deviceType?: string;
    browser?: string;
    operatingSystem?: string;
    screenResolution?: string;
  };
  ipLocation?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  referrer?: string;
  clientIP?: string;
  userAgent?: string;
}

export interface UTMData {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface EventData {
  url: string;
  title?: string;
  referrer?: string;
  duration?: number;
  scrollDepth?: number;
  elementId?: string;
  additionalData?: Record<string, any>;
}

// Estructura estandarizada para eventos
interface StandardEventPayload {
  visitorId?: string; // Se asigna después de crear o actualizar visitante
  type: string;       // Tipo de evento (page_view, form_submit, etc)
  url: string;        // URL donde ocurrió el evento
  referrer?: string;  // De dónde vino el visitante
  duration?: number;  // Tiempo en segundos en esta página
  scrollDepth?: number; // Porcentaje de scroll
  elementId?: string;   // ID del elemento con el que se interactuó
  metadata: string;     // JSON con datos adicionales
  sessionId?: string;   // ID de la sesión actual
  timestamp: string;    // Timestamp ISO
}

/**
 * Envía un evento de tracking estandarizado al webhook de n8n
 */
export async function trackEvent(
  eventType: string,
  visitorData: VisitorData,
  eventData: EventData,
  utmData?: UTMData
): Promise<any> {
  try {
    // URL del webhook de n8n para tracking de visitantes
    const webhookUrl = 'https://n8n.nat-pets.com/webhook/visitor-tracking';
    
    // Crear el payload estándar para enviar al webhook
    const payload: StandardEventPayload = {
      type: eventType,
      url: eventData.url || '',
      referrer: eventData.referrer || visitorData.referrer || '',
      duration: eventData.duration || 0,
      scrollDepth: eventData.scrollDepth || 0,
      elementId: eventData.elementId || undefined,
      metadata: JSON.stringify({
        deviceInfo: visitorData.deviceInfo || {},
        location: visitorData.ipLocation || {},
        userAgent: visitorData.userAgent || '',
        utm: utmData || {},
        additionalData: eventData.additionalData || {}
      }),
      sessionId: visitorData.sessionId || '',
      timestamp: new Date().toISOString()
    };

    // Preparar el paquete completo para el webhook
    const webhookPayload = {
      businessId: visitorData.businessId,
      fingerprint: visitorData.fingerprint || '',
      sessionId: visitorData.sessionId || '',
      capturePoint: eventType,
      clientIP: visitorData.clientIP || '',
      deviceInfo: visitorData.deviceInfo || {},
      ipLocation: visitorData.ipLocation || {},
      userAgent: visitorData.userAgent || '',
      // Campos enriquecidos para ayudar a la preparación del evento
      url: eventData.url || '',
      pageTitle: eventData.title || '',
      referrer: eventData.referrer || visitorData.referrer || '',
      scrollDepth: eventData.scrollDepth || 0,
      duration: eventData.duration || 0,
      utm: utmData || {},
      // El evento completo con estructura estandarizada
      event: payload
    };
    
    // Enviar al webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar evento: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en trackEvent:', error);
    throw error;
  }
}

/**
 * Helper para trackear vistas de página
 */
export async function trackPageView(
  visitorData: VisitorData,
  url: string,
  title?: string,
  referrer?: string,
  utmData?: UTMData
): Promise<any> {
  const eventData: EventData = {
    url,
    title,
    referrer,
    duration: 0, // Se actualiza posteriormente
    scrollDepth: 0 // Se actualiza posteriormente
  };
  
  return trackEvent('page_view', visitorData, eventData, utmData);
}

/**
 * Helper para trackear interacciones con formularios
 */
export async function trackFormInteraction(
  visitorData: VisitorData,
  formId: string,
  interactionType: 'submit' | 'start' | 'abandon',
  formData?: Record<string, any>,
  utmData?: UTMData
): Promise<any> {
  const eventData: EventData = {
    url: window.location.href,
    title: document.title,
    elementId: formId,
    additionalData: {
      interactionType,
      formData: formData || {}
    }
  };
  
  return trackEvent('form_interaction', visitorData, eventData, utmData);
}

export default {
  trackEvent,
  trackPageView,
  trackFormInteraction
};
