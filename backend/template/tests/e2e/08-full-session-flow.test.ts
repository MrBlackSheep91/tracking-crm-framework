/**
 * 🧪 TEST 8: Flujo Completo de Sesión End-to-End
 * Simula un usuario real desde la llegada hasta la conversión
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { app, testBusinessId } from '../setup';
import { generateRealisticSessionStartPayload, generateRealisticLeadCapturePayload } from '../fixtures/realistic-payloads';
import _ from 'lodash';

const prisma = new PrismaClient();

const processAndSend = (payload: any) => {
  const body = { ...payload };
  if (body.sessionData && body.sessionData.businessId) {
    body.businessId = body.sessionData.businessId;
  }

  return request(app)
    .post('/api/v1/track/event')
    .send(body)
    .set('Accept', 'application/json');
};

describe('🔍 Test 8: Flujo Completo de Sesión End-to-End', () => {
  // El setup global en setup.ts ya limpia la BD antes de cada test.
  // No se necesita el hook `beforeEach` local.

  test('✅ Flujo completo: Visitante → Navegación → Conversión', async () => {
    const visitorId = uuidv4();

    const sessionId = uuidv4();

    const userProfile = {
      name: 'Juan Pérez',
      email: `juan.perez.${uuidv4()}@test.com`, // Email único para evitar colisiones
      phone: '+59899123456',
      company: 'Restaurante El Buen Sabor',
    };

    // 1. Inicio de sesión
    const sessionStartPayload = {
      businessId: testBusinessId,
      ...generateRealisticSessionStartPayload(visitorId, sessionId, testBusinessId)
    };
    sessionStartPayload.events.forEach(e => (e as any).businessId = testBusinessId);

    await processAndSend(sessionStartPayload).expect(200);

    // 2. Navegación con scroll y clicks
    const navigationPayload = {
      sessionData: { 
        ...sessionStartPayload.sessionData, 
        businessId: testBusinessId,
        userBehavior: { ...sessionStartPayload.sessionData.userBehavior, sessionDuration: 180000, pageViews: 2, clickCount: 3 } 
      },
      events: [
        {
          eventType: 'scroll',
          businessId: testBusinessId,
          visitorId: visitorId,
          sessionId: sessionId,
          timestamp: new Date(Date.now() + 60000).toISOString(),
          pageUrl: 'https://innova-marketing.com/restaurantes',
          eventData: { 
            scrollPercentage: 75,
            startedAt: new Date(Date.now() + 60000).toISOString()
          },
        },
        {
          eventType: 'page_view',
          businessId: testBusinessId,
          visitorId: visitorId,
          sessionId: sessionId,
          timestamp: new Date(Date.now() + 120000).toISOString(),
          pageUrl: 'https://innova-marketing.com/contacto',
          eventData: { 
            previousPage: 'https://innova-marketing.com/restaurantes',
            startedAt: new Date(Date.now() + 120000).toISOString(),
            referrer: 'https://innova-marketing.com/restaurantes',
            utmSource: '',
            utmCampaign: ''
          },
        },
      ] as any,
    };

    console.log('🔍 [TEST 08] Navigation payload:', JSON.stringify(navigationPayload, null, 2));
    await processAndSend(navigationPayload).expect(200);

    // 3. Conversión final
    const conversionPayload = generateRealisticLeadCapturePayload(visitorId, sessionId, {
      businessId: testBusinessId,
      leadScore: 85,
      leadType: 'hot',
      leadData: userProfile
    });
    // Asegurar que businessId esté en sessionData
    conversionPayload.sessionData.businessId = testBusinessId;
    // Actualizar el userBehavior para la conversión
    conversionPayload.sessionData.userBehavior = { ...sessionStartPayload.sessionData.userBehavior, sessionDuration: 300000, clickCount: 8 };

    await processAndSend(conversionPayload).expect(200);

    // Verificaciones finales

    const session = await prisma.session.findFirst({ where: { sessionId: sessionId } });
    expect(session).toBeTruthy();

    const events = await prisma.trackingEvent.findMany({ where: { sessionId: session!.id }, orderBy: { timestamp: 'asc' } });
    expect(events.length).toBeGreaterThanOrEqual(3);
    
    // Verificar que los tipos de eventos esperados están presentes
    const eventTypes = events.map(e => e.eventType);
    expect(eventTypes).toContain('session_start');
    expect(eventTypes).toContain('scroll');
    expect(eventTypes).toContain('page_view'); // Corregido: page_view en lugar de pageview
    expect(eventTypes).toContain('conversion'); // Corregido: conversion en lugar de lead_capture

    const lead = await prisma.lead.findFirst({ where: { email: userProfile.email } });
    expect(lead).toBeTruthy();
    expect(lead!.score).toBe(85);

    const contact = await prisma.contact.findFirst({ where: { email: userProfile.email } });
    expect(contact).toBeTruthy();

    // 5. Verificar que se crearon actividades para la sesión
    const dbSession = await prisma.session.findUnique({ where: { sessionId } });
    expect(dbSession).toBeDefined();

    const activities = await prisma.activity.findMany({ where: { entityType: 'session', entityId: dbSession!.id } });
    expect(activities.length).toBeGreaterThanOrEqual(3);
  });
});
