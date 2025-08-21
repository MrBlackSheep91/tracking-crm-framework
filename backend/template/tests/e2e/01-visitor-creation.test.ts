/**
 * 🧪 TEST 1: Creación de Visitante en DB
 * Valida que los visitantes se creen correctamente con todos los campos
 */

import request from 'supertest';
import { app, prisma, testBusinessId } from '../setup';
import { generateRealisticSessionStartPayload } from '../fixtures/realistic-payloads';
import { v4 as uuidv4 } from 'uuid';

describe('🔍 Test 1: Creación de Visitante', () => {
  const TEST_VISITOR_ID = uuidv4();
  const TEST_SESSION_ID = uuidv4();
  describe('📊 Creación de Visitor desde payload realista', () => {
        test('✅ Debe crear un visitante nuevo con todos los campos correctos', async () => {
      const payload = generateRealisticSessionStartPayload(TEST_VISITOR_ID, TEST_SESSION_ID, testBusinessId);
      // Mantener type como 'batch_events' y asegurar que eventos tengan businessId correcto
      payload.events.forEach(e => (e as any).businessId = testBusinessId);

      const response = await request(app)
        .post('/api/v1/track/event')
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.processed).toBe(1);

      // Verificar que el visitante se creó en la DB
      const visitor = await prisma.visitor.findUnique({
        where: { visitorId_businessId: { visitorId: TEST_VISITOR_ID, businessId: testBusinessId } }
      });

      expect(visitor).toBeTruthy();
      expect(visitor!.businessId).toBe(testBusinessId);
      expect(visitor!.visitorId).toBe(TEST_VISITOR_ID);
            expect(visitor!.fingerprint).toBe(`fp_${TEST_VISITOR_ID}`);
      
      // Verificar campos de dispositivo
      expect(visitor!.userAgent).toBe("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      expect(visitor!.deviceType).toBe("desktop");
      expect(visitor!.browser).toBe("Chrome");
      expect(visitor!.browserVersion).toBe("120");
      expect(visitor!.operatingSystem).toEqual(expect.any(String));
      expect(visitor!.osVersion).toBe("10");
      expect(visitor!.screenResolution).toBe("1920x1080");
      expect(visitor!.timezone).toBe("America/Montevideo");
      expect(visitor!.language).toBe("es-419");
      
      // Verificar campos de ubicación
      expect(visitor!.country).toBe("Uruguay");
      expect(visitor!.region).toBe("Montevideo");
      expect(visitor!.city).toBe("Montevideo");
      expect(visitor!.latitude).toBe(-34.9011);
      expect(visitor!.longitude).toBe(-56.1645);
      
      // Verificar campos de comportamiento iniciales
      expect(visitor!.sessionsCount).toBe(1);
      expect(visitor!.pageViews).toBe(0);
      expect(visitor!.totalTimeOnSite).toBe(0);
      expect(visitor!.hasHighEngagement).toBe(false);
      expect(visitor!.engagementScore).toBe(0);
      
      // Verificar campos de origen/UTM
      expect(visitor!.firstReferrer).toBe("https://google.com");
      expect(visitor!.firstSource).toBeTruthy();
      expect(visitor!.utmParams).toBeTruthy();
      
      // Verificar timestamps
      expect(visitor!.firstVisitAt).toBeTruthy();
      expect(visitor!.lastVisitAt).toBeTruthy();
      expect(visitor!.createdAt).toBeTruthy();
      expect(visitor!.updatedAt).toBeTruthy();
    });

        test('✅ Debe manejar visitantes duplicados correctamente', async () => {
      const payload = generateRealisticSessionStartPayload(TEST_VISITOR_ID, TEST_SESSION_ID, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      payload.events.forEach(e => (e as any).businessId = testBusinessId);
      // Crear el visitante la primera vez
      await request(app)
        .post('/api/v1/track/event')
        .send(payload)
        .expect(200);

      // Simular una nueva sesión para el mismo visitante
      const payload2 = generateRealisticSessionStartPayload(TEST_VISITOR_ID, uuidv4(), testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      payload2.events.forEach(e => (e as any).businessId = testBusinessId);

      const response2 = await request(app)
        .post('/api/v1/track/event')
        .send(payload2)
        .expect(200);

      // Verificar que solo existe un visitante
      const visitors = await prisma.visitor.findMany({
        where: { visitorId: TEST_VISITOR_ID, businessId: testBusinessId }
      });

      expect(visitors).toHaveLength(1);

      // Verificar que el contador de sesiones se actualizó
      const visitor = visitors[0];
      expect(visitor.sessionsCount).toBe(2);
      expect(visitor.lastVisitAt).toBeTruthy();
    });

        test('✅ Debe crear visitantes con diferentes fingerprints', async () => {
      const payload1 = generateRealisticSessionStartPayload(uuidv4(), `session_${Date.now()}_1`, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      payload1.sessionData.fingerprint = "fp_different_123";
      payload1.events.forEach(e => (e as any).businessId = testBusinessId);

      const payload2 = generateRealisticSessionStartPayload(uuidv4(), `session_${Date.now()}_2`, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      payload2.sessionData.fingerprint = "fp_different_456";
      payload2.events.forEach(e => (e as any).businessId = testBusinessId);

      await request(app).post('/api/v1/track/event').send(payload1).expect(200);
      await request(app).post('/api/v1/track/event').send(payload2).expect(200);

      const visitors = await prisma.visitor.findMany({
        where: {
          visitorId: {
            in: [payload1.sessionData.visitorId, payload2.sessionData.visitorId]
          }
        }
      });

      expect(visitors).toHaveLength(2);
      expect(visitors[0].fingerprint).not.toBe(visitors[1].fingerprint);
    });

        test('❌ Debe fallar si falta businessId', async () => {
      const invalidPayload = generateRealisticSessionStartPayload(TEST_VISITOR_ID, TEST_SESSION_ID, undefined as any);
      // Mantener type como 'batch_events' para validación correcta

      const response = await request(app)
        .post('/api/v1/track/event')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });

        test('❌ Debe fallar si el business no existe', async () => {
      const invalidPayload = generateRealisticSessionStartPayload(TEST_VISITOR_ID, TEST_SESSION_ID, testBusinessId);
      (invalidPayload.sessionData as any).businessId = 'esto-no-es-un-numero';
      // Mantener type como 'batch_events' para validación correcta

      const response = await request(app)
        .post('/api/v1/track/event')
        .send(invalidPayload)
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('📈 Métricas y comportamiento del visitante', () => {
        test('✅ Debe actualizar métricas de comportamiento', async () => {
      const payload = generateRealisticSessionStartPayload(TEST_VISITOR_ID, TEST_SESSION_ID, testBusinessId);
      // Mantener type como 'batch_events' para validación correcta
      payload.events.forEach(e => (e as any).businessId = testBusinessId);
      // Enviar payload inicial
      await request(app)
        .post('/api/v1/track/event')
        .send(payload)
        .expect(200);

      // Verificar visitor inicial
      let visitor = await prisma.visitor.findUnique({
        where: { visitorId_businessId: { visitorId: TEST_VISITOR_ID, businessId: testBusinessId } }
      });
      
      expect(visitor!.pageViews).toBe(0);
      expect(visitor!.totalTimeOnSite).toBe(0);

      // Simular actividad adicional
      const activityPayload = generateRealisticSessionStartPayload(TEST_VISITOR_ID, TEST_SESSION_ID, testBusinessId);
      activityPayload.events.forEach(e => (e as any).businessId = testBusinessId);
      activityPayload.sessionData.userBehavior = {
        ...activityPayload.sessionData.userBehavior,
        sessionDuration: 120000, // 2 minutos
        maxScrollPercentage: 50,
        clickCount: 5,
        engagementScore: 65
      };

      await request(app)
        .post('/api/v1/track/event')
        .send(activityPayload)
        .expect(200);

      // Verificar actualización de métricas
      visitor = await prisma.visitor.findUnique({
        where: { visitorId_businessId: { visitorId: TEST_VISITOR_ID, businessId: testBusinessId } }
      });

      expect(visitor!.totalTimeOnSite).toBeGreaterThan(0);
      expect(visitor!.maxScrollPercentage).toBeGreaterThan(0);
      expect(visitor!.engagementScore).toBeGreaterThan(0);
    });
  });
});
