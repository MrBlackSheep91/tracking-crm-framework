/**
 * 🧪 TEST 2: Creación de Sesiones Completas
 * Valida que las sesiones se creen y gestionen correctamente
 */

import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { app, prisma, testBusinessId } from '../setup';
import { generateRealisticSessionStartPayload } from '../fixtures/realistic-payloads';
import _ from 'lodash';

describe('🔍 Test 2: Creación y Gestión de Sesiones', () => {
  let visitorId: string;
  let sessionId: string;
  let visitor: any;

  beforeEach(async () => {
    visitorId = `test-visitor-${uuidv4()}`;
    sessionId = `test-session-${uuidv4()}`;

    // Crear un visitante para que la sesión tenga a quién asociarse
    visitor = await prisma.visitor.create({
      data: {
        // id es autogenerado por la DB
        visitorId: visitorId, // Este es el ID de negocio requerido
        businessId: testBusinessId,
        fingerprint: `test-fp-${uuidv4()}`,
        ipAddress: '127.0.0.1',
        sessionsCount: 0, // Asegurar un estado inicial consistente
      },
    });
  });

  afterEach(async () => {
    // Limpiar datos creados para evitar conflictos entre tests
    await prisma.trackingEvent.deleteMany({ where: { businessId: testBusinessId } });
    await prisma.session.deleteMany({ where: { businessId: testBusinessId } });
    await prisma.visitor.deleteMany({ where: { businessId: testBusinessId } });
  });

  describe('📊 Creación de Session desde payload realista', () => {
    test('✅ Debe crear una sesión nueva con todos los campos correctos', async () => {
      const payload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      
      
      const response = await request(app)
        .post('/api/v1/track/event')
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);

      const session = await prisma.session.findUnique({
        where: { sessionId: sessionId },
        include: { visitor: true },
      });

      expect(session).toBeTruthy();
      expect(session!.businessId).toBe(testBusinessId);
      expect(session!.visitorId).toBe(visitor.id);
      expect(session!.startedAt).toBeTruthy();
      expect(session!.endedAt).toBeNull();
      
      // Verificar campos clave del payload
      expect(session!.userAgent).toBe(payload.sessionData.deviceInfo.userAgent);
      expect(session!.deviceType).toBe(payload.sessionData.deviceInfo.deviceType);
      expect(session!.browser).toBe(payload.sessionData.deviceInfo.browser);
      expect(session!.operatingSystem).toBe(payload.sessionData.deviceInfo.operatingSystem);
      expect(session!.country).toBe(payload.sessionData.ipLocation.country);
      expect(session!.region).toBe(payload.sessionData.ipLocation.region);
      expect(session!.city).toBe(payload.sessionData.ipLocation.city);
      expect(session!.entryUrl).toBe(payload.sessionData.pageInfo.url);
      expect(session!.referrer).toBe(payload.sessionData.pageInfo.referrer);
      expect(session!.utmSource).toBe(payload.sessionData.pageInfo.utmSource);
    });

    test('✅ Debe actualizar duración y actividad de sesión', async () => {
      const startPayload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      await request(app).post('/api/v1/track/event').send(startPayload).expect(200);

      const updatedPayload = _.merge({}, startPayload, {
        sessionData: {
          userBehavior: {
            sessionDuration: 300000, // 5 minutos
            maxScrollPercentage: 75,
            clickCount: 8,
            timeOnPage: 180000,
          },
          lastActivityAt: new Date().toISOString(),
        },
      });

      await request(app).post('/api/v1/track/event').send(updatedPayload).expect(200);

      const session = await prisma.session.findUnique({ where: { sessionId: sessionId } });
      expect(session!.duration).toBe(300000);
      expect(session!.scrollDepthMax).toBe(75);
      expect(session!.lastActivityAt).toBeTruthy();
    });

    test('✅ Debe finalizar sesión correctamente', async () => {
      const startPayload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      await request(app).post('/api/v1/track/event').send(startPayload).expect(200);

      const endPayload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      // Simular un evento de final de sesión
      endPayload.events = [{
        eventType: 'session_end',
        pageUrl: 'https://innova-marketing.com/exit',
        timestamp: new Date().toISOString(),
        eventData: {
          endedAt: new Date().toISOString(),
          referrer: 'https://google.com',
          utmSource: 'google',
          utmCampaign: 'test'
        },
        metadata: {
          clientTimestamp: Date.now(),
          priority: 'immediate',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows'
        }
      }] as any;
      _.set(endPayload, 'sessionData.userBehavior.sessionDuration', 50000); // Duración final
      _.set(endPayload, 'sessionData.pageInfo.url', 'https://innova-marketing.com/exit');

      await request(app).post('/api/v1/track/event').send(endPayload).expect(200);

      const session = await prisma.session.findUnique({ where: { sessionId: sessionId } });
      expect(session).toBeDefined();
      expect(session!.endedAt).not.toBeNull();
      expect(session!.duration).toBe(endPayload.sessionData.userBehavior.sessionDuration);
      expect(session!.exitUrl).toBe(endPayload.sessionData.pageInfo.url);
      expect(session!.scrollDepthMax).toBe(endPayload.sessionData.userBehavior.maxScrollPercentage);
    });

    test('Debe manejar múltiples sesiones por visitante', async () => {
      const session1Id = `session_${uuidv4()}`;
      const session2Id = `session_${uuidv4()}`;

      const payload1 = generateRealisticSessionStartPayload(visitorId, session1Id, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      const payload2 = generateRealisticSessionStartPayload(visitorId, session2Id, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      _.set(payload2, 'session.startedAt', new Date(Date.now() + 1000).toISOString());

      await request(app).post('/api/v1/track/event').send(payload1).expect(200);
      await request(app).post('/api/v1/track/event').send(payload2).expect(200);

      const sessions = await prisma.session.findMany({
        where: { visitorId: visitor.id }, // Usar el ID numérico del visitante
        include: { visitor: true },
      });

      expect(sessions).toHaveLength(2);
      expect(sessions[0].visitorId).toBe(visitor.id);
      expect(sessions[1].visitorId).toBe(visitor.id);

      const updatedVisitor = await prisma.visitor.findUnique({ where: { id: visitor.id } });
      expect(updatedVisitor!.sessionsCount).toBe(2);
    });
  });

  describe('Métricas avanzadas de sesión', () => {
    test('Debe rastrear páginas visitadas correctamente', async () => {
      const startPayload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      await request(app).post('/api/v1/track/event').send(startPayload).expect(200);

      const nextPagePayload = _.cloneDeep(startPayload);
      // Simular un evento de pageview
      nextPagePayload.events = [{
        eventType: 'page_view',
        pageUrl: 'https://innova-marketing.com/precios',
        timestamp: new Date().toISOString(),
        eventData: {
          pageTitle: 'Precios - Innova Marketing',
          referrer: 'https://google.com',
          utmSource: 'google',
          utmCampaign: 'test'
        },
        metadata: {
          clientTimestamp: Date.now(),
          priority: 'immediate',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows'
        }
      }] as any;
      _.set(nextPagePayload, 'sessionData.pageInfo.url', 'https://innova-marketing.com/precios');

      await request(app).post('/api/v1/track/event').send(nextPagePayload).expect(200);

      const session = await prisma.session.findUnique({ where: { sessionId: sessionId } });
      expect(session).toBeDefined();
      expect(session!.pagesViewed).toBe(2);
      expect(session!.lastPageViewedUrl).toBe('https://innova-marketing.com/precios');
    });

    test('Debe calcular tiempo activo total correctamente', async () => {
      const payload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      _.set(payload, 'sessionData.userBehavior.sessionDuration', 600000);
      _.set(payload, 'sessionData.userBehavior.totalInactiveTime', 120000);
      _.set(payload, 'sessionData.userBehavior.isActive', true);

      await request(app).post('/api/v1/track/event').send(payload).expect(200);

      const session = await prisma.session.findUnique({ where: { sessionId: sessionId } });
      expect(session!.duration).toBe(600000);
      expect(session!.totalActiveTime).toBe(480000); // 600k - 120k
      expect(session!.totalActiveTime).toBeLessThan(session!.duration!);
    });
  });

  describe('❌ Casos de error en sesiones', () => {
        test('❌ Debe fallar si falta sessionId en el payload', async () => {
      const payload = generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      _.set(payload, 'sessionData.sessionId', undefined);

      const response = await request(app)
        .post('/api/v1/track/event')
        .send(payload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Payload de lote de eventos inválido');
    });

      });
});
