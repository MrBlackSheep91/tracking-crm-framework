import { http, HttpResponse } from 'msw';
import type { HttpHandler } from 'msw';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Configuración de los manejadores para las rutas de la API
export const handlers: HttpHandler[] = [
  // Manejador para la ruta de seguimiento de sesión
  http.post('*/api/track-session', async () => {
    return HttpResponse.json(
      { success: true, message: 'Session tracked successfully' },
      { status: 200 }
    );
  }),

  // Manejador para el webhook de seguimiento de sesión
  http.post('https://n8n.nat-pets.com/webhook/session-tracking', async () => {
    return HttpResponse.json(
      { success: true, message: 'Webhook received successfully' },
      { status: 200 }
    );
  }),

  // Manejador para obtener información de geolocalización
  http.get('https://ipapi.co/json/', async () => {
    return HttpResponse.json(
      {
        ip: '127.0.0.1',
        city: 'Buenos Aires',
        region: 'Buenos Aires',
        country_name: 'Argentina',
        country_code: 'AR',
        timezone: 'America/Argentina/Buenos_Aires',
        utc_offset: '-0300',
        org: 'Test ISP',
        asn: 'AS12345',
        asn_org: 'Test Organization'
      },
      { status: 200 }
    );
  }),

  // Manejador para la ruta de seguimiento de conversión
  http.post('*/api/track-conversion', async () => {
    return HttpResponse.json(
      { success: true, message: 'Conversion tracked successfully' },
      { status: 200 }
    );
  }),

  // Manejador para obtener datos de sesión
  http.get('*/api/session/:sessionId', async ({ params }) => {
    const { sessionId } = params as { sessionId: string };
    return HttpResponse.json({
      sessionId,
      visitorId: 'test-visitor-id',
      startTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      pageViews: 1,
      events: []
    }, { status: 200 });
  })
];

// Configuración del servidor de pruebas para Node.js (usado en pruebas unitarias)
import { setupServer } from 'msw/node';

export const setupServerWithHandlers = () => {
  const server = setupServer(...handlers);
  
  beforeAll(() => {
    // Iniciar el servidor de pruebas antes de todas las pruebas
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    // Limpiar cualquier solicitud no manejada después de cada prueba
    server.resetHandlers();
  });

  afterAll(() => {
    // Cerrar el servidor después de todas las pruebas
    server.close();
  });

  return server;
};

export default handlers;
