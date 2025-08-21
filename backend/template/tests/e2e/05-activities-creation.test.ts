/**
 * 🧪 TEST 5: Creación Automática de Actividades
 * Valida que los eventos generen actividades automáticamente en el CRM
 */

import request, { Test } from 'supertest';
import { app, prisma, testBusinessId } from '../setup';
import { v4 as uuidv4 } from 'uuid';
import { Visitor } from '@prisma/client';

// Helper para crear un payload de sesión base
const createBaseSessionData = (visitorId: string, sessionId: string) => ({
  visitorId,
  sessionId,
  businessId: testBusinessId, // Aseguramos que businessId siempre esté en session
  startedAt: new Date().toISOString(),
  deviceInfo: {
    userAgent: 'test-agent',
    type: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
  },
  ipLocation: {
    ip: '127.0.0.1',
    country: 'Uruguay',
    city: 'Montevideo',
  },
  pageInfo: {
    url: 'http://localhost:3000/test-page',
    title: 'Test Page',
    referrer: 'https://google.com',
  },
  userBehavior: {
    sessionDuration: 1000,
    pageViews: 1,
    clickCount: 1,
    scrollDepthMax: 50,
    lastActivityAt: new Date().toISOString(),
    lastPageViewedUrl: 'https://innova-marketing.com/',
    // Añadimos campos requeridos que podrían faltar
    timeOnPage: 1000,
    scrollDirection: 'down',
    isActive: true,
  },
});

const processAndSend = (payload: any): Test => {
  const { session, events } = payload;
  const processedEvents = (events as any[]).map(e => ({
    ...e,
    businessId: session.businessId,
    visitorId: session.visitorId,
    sessionId: session.sessionId,
    timestamp: e.timestamp || new Date().toISOString(),
  }));

  // Convertir a estructura correcta: sessionData + events
  const correctPayload = {
    sessionData: session,
    events: processedEvents
  };

  return request(app)
    .post('/api/v1/track/event')
    .send(correctPayload);
};

describe('🔍 Test 5: Creación Automática de Actividades', () => {
  let visitorId: string;
  let sessionId: string;
  let visitorDbId: string; // Declarar visitorDbId aquí

  beforeEach(async () => {
    visitorId = uuidv4();
    sessionId = uuidv4();

    // Solo creamos el visitante. La sesión se creará dinámicamente.
    const visitor = await prisma.visitor.create({
      data: {
        visitorId,
        businessId: testBusinessId,
      },
    });
    visitorDbId = visitor.id; // Asignar el ID de la base de datos
  });

  describe('📊 Actividades desde Eventos de Tracking', () => {
    test('✅ Debe crear actividad para evento session_start', async () => {
      const sessionData = createBaseSessionData(visitorId, sessionId);
      const payload = {
        session: sessionData,
        events: [
          { eventType: 'session_start', pageUrl: 'https://example.com/home', pageTitle: 'Página Principal' },
        ],
      };

      await processAndSend(payload).expect(200);

      const dbSession = await prisma.session.findUnique({ where: { sessionId } });
      const activity = await prisma.activity.findFirst({
        where: { type: 'session_start', title: 'Nueva sesión iniciada' },
      });

      expect(activity).toBeDefined();
      expect(activity?.title).toBe('Nueva sesión iniciada');
    });

    test('✅ Debe crear actividad para evento universal_click en un CTA', async () => {
      const sessionData = createBaseSessionData(visitorId, sessionId);
      const payload = {
        session: sessionData,
        events: [
          {
            eventType: 'universal_click',
            pageUrl: 'https://example.com/servicios',
            pageTitle: 'Nuestros Servicios',
            targetText: 'Solicitar Cotización',
            targetClasses: 'btn btn-primary cta',
          },
        ],
      };

      await processAndSend(payload).expect(200);

      const activity = await prisma.activity.findFirst({
        where: { type: 'universal_click', title: 'Click en elemento' },
      });

      expect(activity).toBeTruthy();
      expect(activity!.title).toBe('Click en elemento');
    });

    test('✅ Debe crear actividad para evento universal_click en un elemento', async () => {
      const sessionData = createBaseSessionData(visitorId, sessionId);
      const payload = {
        session: sessionData,
        events: [
          {
            eventType: 'universal_click',
            pageUrl: 'https://example.com/servicios',
            pageTitle: 'Nuestros Servicios',
            targetText: 'Solicitar Cotización',
            targetClasses: 'btn btn-primary',
          },
        ],
      };

      await processAndSend(payload).expect(200);

      const activity = await prisma.activity.findFirst({
        where: { type: 'universal_click', title: 'Click en elemento' },
      });

      expect(activity).toBeTruthy();
      expect(activity!.title).toBe('Click en elemento');
    });

    test('✅ Debe crear actividad para evento form_submit', async () => {
      const sessionData = createBaseSessionData(visitorId, sessionId);
      const payload = {
        session: sessionData,
        events: [
          {
            eventType: 'form_submit',
            pageUrl: 'https://example.com/contacto',
            pageTitle: 'Página de Contacto',
            metadata: {
              formId: 'contact-form',
              formFields: { name: 'Juan Perez', email: 'juan.perez@test.com' },
            },
          },
        ],
      };

      await processAndSend(payload).expect(200);

      const activity = await prisma.activity.findFirst({
        where: { type: 'form_submit', title: 'Formulario enviado: Página de Contacto' },
      });

      expect(activity).toBeTruthy();
      expect(activity!.title).toBe('Formulario enviado: Página de Contacto');
    });
  });

  describe('🎯 Actividades de Alto Valor', () => {
    test('✅ Debe crear actividad para evento de conversión', async () => {
      const sessionData = createBaseSessionData(visitorId, sessionId);
      const payload = {
        session: sessionData,
        events: [
          {
            eventType: 'conversion',
            pageUrl: 'https://example.com/gracias',
            pageTitle: 'Gracias por tu compra',
            eventData: {
              name: 'Juan Conversion',
              email: `juan.conversion.${uuidv4()}@test.com`,
              conversionType: 'lead_captured',
              conversionValue: 100,
            },
          },
        ],
      };

      await processAndSend(payload).expect(200);

      const activity = await prisma.activity.findFirst({
        where: { type: 'conversion', title: 'Conversión registrada' },
      });

      expect(activity).toBeTruthy();
      expect(activity!.title).toBe('Conversión registrada');
    });
  });

  describe('🔗 Relación con Leads y Contacts', () => {
    test('✅ Debe crear un Lead y vincularlo a la sesión tras una conversión', async () => {
      const sessionData = createBaseSessionData(visitorId, sessionId);
      const userEmail = `lead.test.${uuidv4()}@example.com`;
      const payload = {
        session: sessionData,
        events: [
          {
            eventType: 'conversion',
            pageUrl: 'https://example.com/thank-you',
            pageTitle: 'Thank You',
            timestamp: new Date().toISOString(),
            businessId: testBusinessId,
            visitorId: visitorId,
            sessionId: sessionId,
            eventData: { 
              name: 'Test Lead', 
              email: userEmail,
              source: 'landing-page',
              campaign: 'test-campaign'
            },
          },
        ],
      };

      await processAndSend(payload).expect(200);

      const dbSession = await prisma.session.findUnique({ where: { sessionId } });
      const lead = await prisma.lead.findFirst({
        where: {
          email: userEmail,
          businessId: testBusinessId
        },
      });

      expect(lead).toBeTruthy();
      expect(lead!.name).toBe('Test Lead');
      expect(lead!.email).toBe(userEmail);
    });
  });

  describe('⚡ Performance y Filtrado de Actividades', () => {
    test('✅ No debe crear actividad para eventos no configurados', async () => {
      const nonTriggeringEvent = {
        eventType: 'some_random_event',
        pageUrl: 'https://innova-marketing.com/',
        timestamp: new Date().toISOString(),
      };

      const payload = {
        session: createBaseSessionData(visitorId, sessionId),
        events: [nonTriggeringEvent],
      };

      await processAndSend(payload).expect(200);

      const activity = await prisma.activity.findFirst({
        where: { type: 'some_random_event' },
      });

      expect(activity).toBeNull();
    });
  });
});
