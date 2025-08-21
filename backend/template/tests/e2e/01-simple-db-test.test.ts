import { describe, test, expect } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { prisma, testBusinessId } from '../setup';

describe('🔍 Test 1: Operaciones Básicas de Base de Datos', () => {

  // Función helper para crear un visitor de prueba
  const createTestVisitor = () => {
    return prisma.visitor.create({
      data: {
        id: uuidv4(),
        businessId: testBusinessId,
        visitorId: `visitor_${Date.now()}`,
        fingerprint: `fp_${Date.now()}`,
      }
    });
  };

  test('✅ Debe crear un visitor en la base de datos', async () => {
    const visitor = await createTestVisitor();
    expect(visitor).toBeDefined();
    expect(visitor.businessId).toBe(testBusinessId);
  });

  test('✅ Debe crear una sesión para el visitor', async () => {
    const visitor = await createTestVisitor();
    const session = await prisma.session.create({
      data: {
        id: uuidv4(),
        sessionId: uuidv4(),
        businessId: testBusinessId,
        visitorId: visitor.id,
      }
    });

    expect(session).toBeDefined();
    expect(session.visitorId).toBe(visitor.id);
  });

  test('✅ Debe crear un evento de tracking', async () => {
    const visitor = await createTestVisitor();
    const session = await prisma.session.create({ data: { id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId: visitor.id } });
    
    const event = await prisma.trackingEvent.create({
      data: {
        id: uuidv4(),
        businessId: testBusinessId,
        visitorId: visitor.id,
        sessionId: session.id,
        eventType: 'pageview',
        pageUrl: 'https://innova-marketing.com/',
      }
    });

    expect(event).toBeDefined();
    expect(event.eventType).toBe('pageview');
  });

  test('✅ Debe crear un lead básico', async () => {
    const visitor = await createTestVisitor();
    const session = await prisma.session.create({ data: { id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId: visitor.id } });

    const lead = await prisma.lead.create({
      data: {
        id: uuidv4(),
        businessId: testBusinessId,
        visitorId: visitor.id,
        sessionId: session.id,
        email: 'test@example.com',
        status: 'NEW',
      }
    });

    expect(lead).toBeDefined();
    expect(lead.email).toBe('test@example.com');
  });

  test('✅ Debe consultar relaciones entre entidades', async () => {
    const visitor = await createTestVisitor();
    const session = await prisma.session.create({ data: { id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId: visitor.id } });
    await prisma.trackingEvent.create({ data: { id: uuidv4(), businessId: testBusinessId, visitorId: visitor.id, sessionId: session.id, eventType: 'test', pageUrl: '/' } });
    await prisma.lead.create({ data: { id: uuidv4(), businessId: testBusinessId, visitorId: visitor.id, sessionId: session.id, email: 'relation@test.com', status: 'NEW' } });

    const visitorWithRelations = await prisma.visitor.findUnique({
      where: { id: visitor.id },
      include: { sessions: true, events: true, leads: true }
    });

    expect(visitorWithRelations).toBeDefined();
    expect(visitorWithRelations!.sessions).toHaveLength(1);
    expect(visitorWithRelations!.events).toHaveLength(1);
    expect(visitorWithRelations!.leads).toHaveLength(1);
  });

  test('✅ Debe actualizar métricas del visitor', async () => {
    const visitor = await createTestVisitor();
    
    const updatedVisitor = await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        sessionsCount: 1,
        pageViews: 1,
        totalTimeOnSite: 120,
        engagementScore: 85
      }
    });

    expect(updatedVisitor.sessionsCount).toBe(1);
    expect(updatedVisitor.pageViews).toBe(1);
    expect(updatedVisitor.engagementScore).toBe(85);
  });
});
