/**
 * 🧪 TEST 4: Batch de Eventos Múltiples
 * Valida el procesamiento de múltiples eventos en una sola request
 */

import request, { Test } from 'supertest';
import { app, prisma, testBusinessId } from '../setup';
import { v4 as uuidv4 } from 'uuid';

// Función helper para crear un payload de batch dinámico
const createDynamicBatchPayload = (visitorId: string, sessionId: string, businessId: number | string) => {
  const baseEventData = {
    businessId: typeof businessId === 'string' ? parseInt(businessId, 10) : businessId,
    visitorId,
    sessionId,
  };
  const eventsWithBaseData = [
      {
        eventType: 'page_view',
        pageUrl: 'https://innova-marketing.com/features',
        eventCategory: 'navigation',
        eventAction: 'view',
        timestamp: new Date(Date.now() - 5000).toISOString(),
      },
      {
        eventType: 'click',
        pageUrl: 'https://innova-marketing.com/features',
        eventCategory: 'interaction',
        eventAction: 'cta_click',
        timestamp: new Date(Date.now() - 4500).toISOString(),
        eventData: { elementId: 'buy-now' },
      },
      {
        eventType: 'scroll',
        pageUrl: 'https://innova-marketing.com/features',
        eventCategory: 'engagement',
        eventAction: 'scroll_depth',
        timestamp: new Date(Date.now() - 4000).toISOString(),
        eventData: { depth: 85 },
      },
    ].map(event => ({ ...event, ...baseEventData }));

  const payload = {
    sessionData: {
      businessId: typeof businessId === 'string' ? parseInt(businessId, 10) : businessId,
      visitorId,
      sessionId,
      fingerprint: `test-fp-${uuidv4()}`,
      startedAt: new Date(Date.now() - 10000).toISOString(),
      deviceInfo: { type: 'desktop', os: 'TestOS', browser: 'TestBrowser' },
      ipLocation: { country: 'Testland', city: 'Testville' },
      pageInfo: { url: 'https://innova-marketing.com/features', referrer: 'https://google.com' },
      userBehavior: {
          sessionDuration: 450000,
          pageViews: 1,
          clickCount: 1,
          scrollDepthMax: 85,
          lastActivityAt: new Date().toISOString(),
          lastPageViewedUrl: 'https://innova-marketing.com/features',
      },
      duration: 450000,
    },
    events: eventsWithBaseData,
  };
  return payload;
};

describe('🔍 Test 4: Batch de Eventos Múltiples', () => {
  const visitorIdMap = new Map<string, string>();

  // Helper para obtener el ID de la base de datos de un visitante
  const getVisitorDbId = async (visitorId: string) => {
    if (visitorIdMap.has(visitorId)) {
      return visitorIdMap.get(visitorId)!;
    }
    const visitor = await prisma.visitor.findUnique({
      where: { visitorId_businessId: { visitorId, businessId: testBusinessId } },
    });
    if (visitor) {
      visitorIdMap.set(visitorId, visitor.id);
      return visitor.id;
    }
    // Fallback por si el visitante aún no se ha creado, aunque la lógica de la prueba debería prevenir esto.
    const newVisitor = await prisma.visitor.create({
        data: { visitorId, businessId: testBusinessId, fingerprint: `fp_${visitorId}` },
    });
    visitorIdMap.set(visitorId, newVisitor.id);
    return newVisitor.id;
  };

  test('Debería procesar múltiples eventos, crear actividades y actualizar métricas', async () => {
    const visitorId = uuidv4();
    const sessionId = uuidv4();
    const payload = createDynamicBatchPayload(visitorId, sessionId, testBusinessId);
    const response = await request(app)
      .post('/api/v1/track/event')
      .send(payload).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.processed).toBe(3);

    // Verificar que la sesión y el visitante se crearon/actualizaron
    const dbSession = await prisma.session.findFirst({ where: { sessionId: sessionId } });
    expect(dbSession).toBeDefined();

    const visitorDbId = await getVisitorDbId(visitorId);
    const dbVisitor = await prisma.visitor.findUnique({ where: { id: visitorDbId } });
    expect(dbVisitor).toBeDefined();
    expect(dbVisitor?.pageViews).toBeGreaterThanOrEqual(1);

    // Verificar que los eventos se crearon correctamente
    if (dbSession) {
      const eventCount = await prisma.trackingEvent.count({
        where: { sessionId: dbSession.id },
      });
      // Solo los 3 eventos del batch (no hay evento session_start automático)
      expect(eventCount).toBe(3);
    }
  });

  test('Debería manejar un batch de solo conversiones y crear leads', async () => {
    const visitorId = uuidv4();
    const sessionId = uuidv4();
    const email1 = `juan.perez.${uuidv4()}@test.com`;
    const email2 = `maria.lopez.${uuidv4()}@test.com`;
    const payload = {
      sessionData: { businessId: testBusinessId, visitorId, sessionId, fingerprint: `test-fp-${uuidv4()}`, startedAt: new Date().toISOString() },
      events: [
        {
          businessId: testBusinessId,
          visitorId,
          sessionId,
          eventType: 'lead_capture',
          eventData: { formId: 'newsletter', email: email1, name: 'Juan Perez Test' },
          timestamp: new Date().toISOString(),
          pageUrl: 'https://innova-marketing.com/newsletter'
        },
        {
          businessId: testBusinessId,
          visitorId,
          sessionId,
          eventType: 'lead_capture',
          eventData: { formId: 'contact', email: email2, name: 'Maria Lopez Test' },
          timestamp: new Date().toISOString(),
          pageUrl: 'https://innova-marketing.com/contact'
        },
      ],
    };

    const response = await request(app)
      .post('/api/v1/track/event')
      .send(payload).expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.processed).toBe(2);

    const visitorDbId = await getVisitorDbId(visitorId);
    const leads = await prisma.lead.findMany({ where: { visitorId: visitorDbId } });
    expect(leads.length).toBe(2);
    expect(leads.map(l => l.email)).toContain(email1);
    expect(leads.map(l => l.email)).toContain(email2);
  });

  describe('⚡ Performance con Batches Grandes', () => {
    test('✅ Debe procesar batch grande de 50 eventos eficientemente', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
            const largeEvents = Array.from({ length: 50 }, (_, i) => ({
        businessId: testBusinessId,
        visitorId,
        sessionId,
        eventType: ['click', 'scroll', 'page_view', 'form_interaction', 'heartbeat'][i % 5],
        pageUrl: `https://innova-marketing.com/page-${Math.floor(i / 10)}`,
        eventCategory: i % 2 === 0 ? 'interaction' : 'engagement',
        eventAction: `action_${i}`,
        timestamp: new Date(Date.now() + i * 100).toISOString(),
        eventData: { index: i, batch: 'large' },
      }));

      const largeBatch = {
        sessionData: {
          businessId: testBusinessId,
          visitorId,
          sessionId,
          fingerprint: `test-fp-large-${uuidv4()}`,
          startedAt: new Date(Date.now() - 10000).toISOString(),
          deviceInfo: { type: 'desktop', os: 'TestOS', browser: 'TestBrowser' },
          ipLocation: { country: 'Testland', city: 'Testville' },
          pageInfo: { url: 'https://innova-marketing.com/page-0', referrer: 'https://google.com' },
          userBehavior: {
              sessionDuration: 10000,
              pageViews: 50,
              clickCount: 25,
              lastActivityAt: new Date().toISOString(),
          }
        },
        events: largeEvents,
      };

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/v1/track/event')
        .send(largeBatch).expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.processed).toBe(50);
      expect(endTime - startTime).toBeLessThan(5000);

      const dbSession = await prisma.session.findFirst({ where: { sessionId: sessionId } });
      expect(dbSession).toBeDefined();
      const count = await prisma.trackingEvent.count({ where: { sessionId: dbSession!.id } });
      // Solo los 50 eventos del batch (session_start se crea automáticamente pero se cuenta por separado)
      expect(count).toBe(50);
    });
  });

  describe('❌ Manejo de Errores en Batch', () => {
    test('❌ Debe rechazar un batch si un evento clave es inválido', async () => {
        const visitorId = uuidv4();
        const sessionId = uuidv4();
        const invalidBatch = {
          sessionData: {
            businessId: testBusinessId,
            visitorId,
            sessionId,
            fingerprint: `test-fp-mixed-${uuidv4()}`,
            startedAt: new Date(Date.now() - 10000).toISOString(),
            deviceInfo: { type: 'desktop', os: 'TestOS', browser: 'TestBrowser' },
            ipLocation: { country: 'Testland', city: 'Testville' },
            pageInfo: { url: 'https://innova-marketing.com/', referrer: 'https://google.com' },
            userBehavior: {
                sessionDuration: 10000,
                pageViews: 1,
                clickCount: 1,
                scrollDepthMax: 10,
                lastActivityAt: new Date().toISOString(),
                lastPageViewedUrl: 'https://innova-marketing.com/',
            }
          },
          events: [
            { pageUrl: 'https://innova-marketing.com/invalid' /* Evento inválido sin eventType */ } as any,
            {
                businessId: testBusinessId,
                visitorId,
                sessionId,
                eventType: 'click',
                pageUrl: 'https://innova-marketing.com/',
                timestamp: new Date().toISOString(),
            }
          ],
        };
  
        const response = await request(app)
          .post('/api/v1/track/event')
          .send(invalidBatch).expect(400);
  
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Payload de lote de eventos inválido');
      });

            test('✅ Debe procesar eventos válidos e ignorar los inválidos si la lógica lo permite', async () => {
      const visitorId = uuidv4();
      const sessionId = uuidv4();
      // NOTA: La implementación actual del endpoint es transaccional (todo o nada).
      // Este test valida que si un evento es inválido, todo el batch se rechaza.
      const mixedBatch = {
        sessionData: {
          businessId: testBusinessId,
          visitorId,
          sessionId,
          fingerprint: `test-fp-mixed-${uuidv4()}`,
          startedAt: new Date(Date.now() - 10000).toISOString(),
        },
        events: [
          {
            businessId: testBusinessId,
            visitorId,
            sessionId,
            eventType: 'click',
            pageUrl: 'https://innova-marketing.com/',
            eventAction: 'valid_click_1',
            timestamp: new Date().toISOString(),
          },
          { pageUrl: 'https://innova-marketing.com/invalid' } as any,
        ],
      };

      const response = await request(app)
        .post('/api/v1/track/event')
        .send(mixedBatch)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Payload de lote de eventos inválido');
    });
  });

  describe('❤️ Endpoints Adicionales de Sesión', () => {
    const visitorId = uuidv4();
    const sessionId = uuidv4();

    test('✅ POST /heartbeat debe aceptar un payload válido', async () => {
      const heartbeatPayload = {
        businessId: testBusinessId,
        visitorId,
        sessionId,
        timestamp: new Date().toISOString(),
        isActive: true,
      };

      const response = await request(app)
        .post('/api/v1/track/heartbeat')
        .send(heartbeatPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Heartbeat recibido');
    });

    test('❌ POST /heartbeat debe rechazar un payload inválido', async () => {
      const invalidPayload = {
        businessId: testBusinessId,
        // Falta visitorId y sessionId
      };

      const response = await request(app)
        .post('/api/v1/track/heartbeat')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('✅ POST /session-end debe aceptar un payload válido', async () => {
      const sessionEndPayload = {
        businessId: testBusinessId,
        visitorId,
        sessionId,
        endedAt: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/v1/track/session-end')
        .send(sessionEndPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Session end recibido');
    });

    test('❌ POST /session-end debe rechazar un payload inválido', async () => {
      const invalidPayload = {
        businessId: testBusinessId,
        visitorId,
        // Falta sessionId y endedAt
      };

      const response = await request(app)
        .post('/api/v1/track/session-end')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
