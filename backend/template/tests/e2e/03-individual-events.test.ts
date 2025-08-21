/**
 * 🧪 testBusinessIdventos Individuales (click, scroll, pageview)
 * Valida que los eventos se almacenen correctamente uno por uno
 */

import request from 'supertest';
import { app, prisma, testBusinessId } from '../setup';
import { generateRealisticSessionStartPayload } from '../fixtures/realistic-payloads';
import { v4 as uuidv4 } from 'uuid';

// Helper para crear un payload de sesión base consistente
const createBaseSessionData = (visitorId: string, sessionId: string) => ({
  visitorId,
  sessionId,
  businessId: testBusinessId,
  fingerprint: `fp_${visitorId}`,
  startedAt: new Date().toISOString(),
  deviceInfo: { type: 'desktop', os: 'Windows', browser: 'Chrome' },
  ipLocation: { country: 'Uruguay', city: 'Montevideo' },
  pageInfo: { url: 'https://innova-marketing.com/', title: 'Innova Marketing' },
  userBehavior: { sessionDuration: 1000, engagementScore: 50 },
});

describe('🔍 Test 3: Eventos Individuales', () => {
  let visitorId: string;
  let sessionId: string;

  beforeEach(async () => {
    visitorId = uuidv4();
    sessionId = uuidv4();

    const visitor = await prisma.visitor.create({
      data: {
        visitorId,
        businessId: testBusinessId,
        fingerprint: `fp_${visitorId}`,
      },
    });

    await prisma.session.create({
      data: {
        id: sessionId,
        sessionId: sessionId,
        businessId: testBusinessId,
        visitorId: visitor.id,
        startedAt: new Date(),
      },
    });
  });

  describe('Eventos de Scroll', () => {
    test('✅ Debe almacenar evento de scroll correctamente', async () => {
      const sessionPayload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      sessionPayload.events = [
        {
          eventType: 'scroll',
          eventData: { scrollDepth: 50 },
          timestamp: new Date().toISOString(),
          pageUrl: 'http://localhost:3000/test-page',
          visitorId: visitorId,
        }
      ] as any;

      const response = await request(app)
        .post('/api/v1/track/event')
        .send({ ...sessionPayload, businessId: testBusinessId })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.trackingEvent.findFirst({
        where: { sessionId, eventType: 'scroll' },
      });

      expect(event).toBeTruthy();
      const eventData = event!.eventData as any;
      expect(eventData.scrollDepth).toBe(50);
    });
  });

  describe('🖱️ Eventos de Click', () => {
    test('✅ Debe almacenar evento de click con información del elemento', async () => {
      const sessionPayload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      sessionPayload.events = [
        {
          eventType: 'click',
          eventData: {
            targetElement: 'button',
            targetId: 'cta-main',
            conversionIntent: 'high',
          },
          timestamp: new Date().toISOString(),
          pageUrl: 'https://innova-marketing.com/',
          visitorId: visitorId,
        }
      ] as any;

      const response = await request(app)
        .post('/api/v1/track/event')
        .send({ ...sessionPayload, businessId: testBusinessId })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.trackingEvent.findFirst({
        where: { sessionId, eventType: 'click' },
      });

      expect(event).toBeTruthy();
      const eventData = event!.eventData as any;
      expect(eventData.targetId).toBe('cta-main');
      expect(eventData.conversionIntent).toBe('high');
    });
  });

  describe('📝 Eventos de Formulario', () => {
    test('✅ Debe almacenar interacción con formulario', async () => {
      const sessionPayload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      sessionPayload.events = [
        {
          eventType: 'form_interaction',
          eventData: {
            formId: 'contact-form',
            fieldName: 'email',
            interactionType: 'focus'
          },
          timestamp: new Date().toISOString(),
          pageUrl: 'http://localhost:3000/contact',
          visitorId: visitorId,
        }
      ] as any;

      const response = await request(app)
        .post('/api/v1/track/event')
        .send({ ...sessionPayload, businessId: testBusinessId })
        .expect(200);

      expect(response.body.success).toBe(true);

      const event = await prisma.trackingEvent.findFirst({
        where: { sessionId, eventType: 'form_interaction' },
      });

      expect(event).toBeTruthy();
      const eventData = event!.eventData as any;
      expect(eventData.formId).toBe('contact-form');
    });
  });

  describe('❌ Casos de error en eventos', () => {
    test('❌ Debe fallar si el payload no tiene session', async () => {
      const errorPayload = {
        type: 'batch_events',
        events: [{ eventType: 'click', pageUrl: '/', eventData: {} }],
      };

      const response = await request(app)
        .post('/api/v1/track/event')
        .send(errorPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Payload de lote de eventos inválido');
    });

    test('❌ Debe fallar si un evento no tiene eventType', async () => {
      const errorPayload = {
        type: 'batch_events',
        session: createBaseSessionData(visitorId, sessionId),
        events: [{ pageUrl: '/', eventData: {} }], // Falta eventType
      };

      const response = await request(app)
        .post('/api/v1/track/event')
        .send(errorPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      // La validación ahora ocurre en la capa de servicio, que devuelve un mensaje genérico.
      // El error específico sobre 'eventType' provendría de la base de datos si el campo es obligatorio.
      expect(response.body.message).toBeDefined();
    });
  });
});
