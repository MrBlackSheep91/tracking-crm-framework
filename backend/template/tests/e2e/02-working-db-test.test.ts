import { describe, test, expect } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { prisma, testBusinessId } from '../setup';

describe('🔍 Test 2: Operaciones de Base de Datos Funcionales', () => {
  let testVisitorId: string;
  let testSessionId: string;

  test('✅ Debe ejecutar un flujo completo de creación y verificación de datos', async () => {
    // 1. Crear Visitor
    // Nota: Prisma autogenera el ID del visitante, por lo que no podemos compararlo con un ID predefinido.
    // En su lugar, capturamos el ID real del visitante creado.
    const visitor = await prisma.visitor.create({
      data: {
        visitorId: `visitor_${Date.now()}`,
        fingerprint: `fp_${Date.now()}`,
        deviceType: 'desktop',
        browser: 'Chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '127.0.0.1',
        country: 'Uruguay',
        city: 'Montevideo',
        business: { connect: { id: testBusinessId } },
      },
    });
    expect(visitor).toBeDefined();
    // Actualizamos testVisitorId con el ID real del visitante creado
    testVisitorId = visitor.id;

    // 2. Crear Sesión
    testSessionId = uuidv4();
    const session = await prisma.session.create({
      data: {
        id: testSessionId,
        sessionId: testSessionId,
        startedAt: new Date(),
        entryUrl: 'https://innova-marketing.com/',
        business: { connect: { id: testBusinessId } },
        visitor: { connect: { id: testVisitorId } },
      },
    });
    expect(session).toBeDefined();
    expect(session.visitorId).toBe(testVisitorId);

    // 3. Crear Eventos
    const eventTypes = ['pageview', 'click', 'form_submit'];
    for (const eventType of eventTypes) {
      await prisma.trackingEvent.create({
        data: {
          business: { connect: { id: testBusinessId } },
          visitor: { connect: { id: testVisitorId } },
          session: { connect: { id: testSessionId } },
          eventType: eventType,
          pageUrl: `https://innova-marketing.com/page`,
        },
      });
    }
    const events = await prisma.trackingEvent.findMany({ where: { sessionId: testSessionId } });
    expect(events).toHaveLength(3);

    // 4. Crear Lead
    await prisma.lead.create({
      data: {
        email: 'test.lead@example.com',
        name: 'Test Lead User',
        status: 'NEW',
        stage: 'AWARENESS',
        score: 75,
        campaignName: 'test-campaign',
        business: { connect: { id: testBusinessId } },
        visitor: { connect: { id: testVisitorId } },
        session: { connect: { id: testSessionId } },
      },
    });

    // 5. Consultar Relaciones y Métricas
    const visitorComplete = await prisma.visitor.findUnique({
      where: { id: testVisitorId },
      include: { sessions: true, events: true, leads: true },
    });
    expect(visitorComplete).toBeDefined();
    expect(visitorComplete!.sessions).toHaveLength(1);
    expect(visitorComplete!.events).toHaveLength(3);
    expect(visitorComplete!.leads).toHaveLength(1);

    // 6. Actualizar Métricas del Visitor
    const updatedVisitor = await prisma.visitor.update({
      where: { id: testVisitorId },
      data: { sessionsCount: 1, pageViews: 3, totalTimeOnSite: 300, engagementScore: 85 },
    });
    expect(updatedVisitor.engagementScore).toBe(85);

    // 7. Calcular Estadísticas Agregadas
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: testBusinessId },
      include: {
        _count: {
          select: { 
            visitors: true, 
            Session: true, 
            TrackingEvent: true, 
            leads: true 
          },
        },
      },
    });
    // Since beforeEach cleans the DB, we expect the counts to be related to this test only.
    expect(business._count.visitors).toBeGreaterThanOrEqual(1);
    expect(business._count.Session).toBeGreaterThanOrEqual(1);
    expect(business._count.TrackingEvent).toBeGreaterThanOrEqual(3);
    expect(business._count.leads).toBeGreaterThanOrEqual(1);
  });
});
