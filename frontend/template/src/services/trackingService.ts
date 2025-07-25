/**
 * trackingService.ts
 * Servicio para enviar eventos de tracking inmediatos al webhook de visitor-tracking
 * sin esperar al cierre de la sesión
 */

/**
 * Envía un evento de tracking inmediato al webhook de visitor-tracking
 * sin esperar al cierre de la sesión. Útil para registrar conversiones
 * inmediatamente cuando ocurren.
 * @param event - El evento a enviar
 * @returns Promesa que se resuelve cuando el evento ha sido enviado
 */
export const sendImmediateTrackingEvent = async (event: {
  eventType: string;
  metadata: any;
  visitorId: string;
}): Promise<{success: boolean, error?: string}> => {
  try {
    // URL del webhook de tracking para desarrollo local
    const TRACKING_WEBHOOK = 'http://localhost:5678/webhook/visitor-tracking';
    
    const payload = {
      singleEvent: true, // Flag para indicar que es un evento individual, no toda la sesión
      session: {
        visitorId: event.visitorId,
        sessionId: localStorage.getItem('sessionId') || event.visitorId,
        businessId: localStorage.getItem('businessId') || '00000000-0000-0000-0000-000000000001'
      },
      event: {
        eventType: event.eventType,
        metadata: event.metadata,
        createdAt: new Date().toISOString(),
        pageUrl: window.location.href
      }
    };
    
    console.log('Enviando evento de tracking inmediato:', event.eventType, payload);
    
    const response = await fetch(TRACKING_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    console.log('Evento de tracking inmediato enviado exitosamente:', event.eventType);
    return { success: true };
  } catch (error) {
    console.error('Error enviando evento de tracking inmediato:', error);
    return { success: false, error: (error as Error).message };
  }
};
