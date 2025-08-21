import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { Session } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma, testBusinessId } from '../setup';

describe('🔍 Test 3: Cálculos Realistas y Métricas Automáticas', () => {
  let visitorId: string;

  beforeEach(async () => {
    visitorId = uuidv4();
    await prisma.visitor.create({
      data: {
        id: visitorId,
        businessId: testBusinessId,
        visitorId: `visitor_${Date.now()}`,
        fingerprint: `fp_${Date.now()}`,
        deviceType: 'desktop',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        country: 'Uruguay',
        region: 'Montevideo',
        city: 'Montevideo',
        latitude: -34.9011,
        longitude: -56.1645,
        ipAddress: '200.0.133.45', // Added IP for consistency
        firstSource: 'google',
        firstMedium: 'cpc',
        firstCampaign: 'verano-2024',
        sessionsCount: 0,
      },
    });
  });

  afterEach(async () => {
    if (visitorId) {
      // Use transaction for faster cleanup
      await prisma.$transaction([
        prisma.trackingEvent.deleteMany({ where: { visitorId } }),
        prisma.session.deleteMany({ where: { visitorId } }),
        prisma.lead.deleteMany({ where: { visitorId } }),
        prisma.visitor.deleteMany({ where: { id: visitorId } })
      ]);
    }
  });

  test('✅ Visitor debe tener datos iniciales correctos', async () => {
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    expect(visitor).toBeDefined();
    expect(visitor?.country).toBe('Uruguay');
    expect(visitor?.firstSource).toBe('google');
    expect(visitor?.sessionsCount).toBe(0);
  });

  test('✅ Debe incrementar sessionCount correctamente con múltiples sesiones', async () => {
    const sessions: Session[] = [];
    
    for (let i = 0; i < 3; i++) {
      const sessionId = uuidv4();
      const startTime = new Date(Date.now() - (i + 1) * 3600000);
      const endTime = new Date(startTime.getTime() + (i + 1) * 900000);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      const session = await prisma.session.create({
        data: {
          id: sessionId,
          sessionId: sessionId,
          businessId: testBusinessId,
          visitorId: visitorId,
          startedAt: startTime,
          endedAt: endTime,
          duration: duration,
          totalActiveTime: duration - 60,
          deviceType: 'desktop',
          browser: 'Chrome',
          browserVersion: '120.0.0.0',
          operatingSystem: 'Windows',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: '200.0.133.45',
          country: 'Uruguay',
          region: 'Montevideo',
          city: 'Montevideo',
          latitude: -34.9011,
          longitude: -56.1645,
          entryUrl: `https://innova-marketing.com/page-${i + 1}`,
          exitUrl: `https://innova-marketing.com/exit-${i + 1}`,
          lastPageViewedUrl: `https://innova-marketing.com/last-${i + 1}`,
          scrollDepthMax: 85 + i * 5,
          utmSource: i === 0 ? 'google' : i === 1 ? 'facebook' : 'email',
          utmMedium: i === 0 ? 'cpc' : i === 1 ? 'social' : 'newsletter',
          utmCampaign: `campaign-${i + 1}`,
          utmContent: `content-${i + 1}`,
          utmTerm: `term-${i + 1}`
        }
      });
      sessions.push(session);
    }

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalPageViews = sessions.length * 3;
    const avgScrollDepth = sessions.reduce((sum, s) => sum + (s.scrollDepthMax || 0), 0) / sessions.length;
    
    const updatedVisitor = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        sessionsCount: sessions.length,
        totalTimeOnSite: totalDuration,
        pageViews: totalPageViews,
        scrollDepthMax: Math.max(...sessions.map(s => s.scrollDepthMax || 0)),
        maxScrollPercentage: Math.max(...sessions.map(s => s.scrollDepthMax || 0)),
        lastActivityAt: sessions[sessions.length - 1].endedAt,
        engagementScore: Math.min(100, Math.floor((totalDuration / 60) + (totalPageViews * 2) + avgScrollDepth))
      }
    });

    expect(updatedVisitor.sessionsCount).toBe(3);
    expect(updatedVisitor.totalTimeOnSite).toBe(totalDuration);
    expect(updatedVisitor.pageViews).toBe(9);
    expect(updatedVisitor.scrollDepthMax).toBe(95);
    expect(updatedVisitor.engagementScore).toBeGreaterThan(0);
  });

  test('✅ Debe rastrear diferentes sources y campañas UTM correctamente', async () => {
    // Crear sesiones para este test específico
    await prisma.session.createMany({
        data: [
            { id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId, utmSource: 'google', utmMedium: 'cpc' },
            { id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId, utmSource: 'facebook', utmMedium: 'social' },
            { id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId, utmSource: 'email', utmMedium: 'newsletter' },
        ]
    });

    const sessionsBySource = await prisma.session.groupBy({
      by: ['utmSource'],
      where: { visitorId: visitorId },
      _count: { id: true }
    });

    expect(sessionsBySource).toHaveLength(3);
    const sources = sessionsBySource.map(s => s.utmSource);
    expect(sources).toEqual(expect.arrayContaining(['google', 'facebook', 'email']));

    const sessionsByMedium = await prisma.session.groupBy({
      by: ['utmMedium'],
      where: { visitorId: visitorId },
      _count: { id: true }
    });

    const mediums = sessionsByMedium.map(s => s.utmMedium);
    expect(mediums).toEqual(expect.arrayContaining(['cpc', 'social', 'newsletter']));
  });

  test('✅ Debe calcular métricas de engagement basadas en comportamiento', async () => {
    const session = await prisma.session.create({ data: { id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId, scrollDepthMax: 80, totalActiveTime: 120 } });
    const events = [
      { eventType: 'pageview', eventValue: 1 },
      { eventType: 'click', eventValue: 5 },
      { eventType: 'scroll', eventValue: 2 },
      { eventType: 'time_spent', eventValue: 4 }, // 120s / 30s
    ];

    await prisma.trackingEvent.createMany({
      data: events.map(e => ({ 
        ...e, 
        id: uuidv4(), 
        businessId: testBusinessId, 
        visitorId, 
        sessionId: session.id, 
        pageUrl: 'https://innova-marketing.com/test-page' // Campo requerido añadido
      }))
    });

    const eventsByType = await prisma.trackingEvent.groupBy({
      by: ['eventType'],
      where: { visitorId: visitorId },
      _count: { id: true },
      _sum: { eventValue: true }
    });

    const totalEngagementValue = eventsByType.reduce((sum, e) => sum + (e._sum.eventValue || 0), 0);
    
    const finalVisitor = await prisma.visitor.update({
      where: { id: visitorId },
      data: { engagementScore: Math.min(100, totalEngagementValue), hasHighEngagement: totalEngagementValue > 50 }
    });

    expect(finalVisitor.engagementScore).toBe(12); // 1+5+2+4
    expect(finalVisitor.hasHighEngagement).toBe(false);
  });

  test('✅ Debe validar que campos geográficos están completos', async () => {
    const visitor = await prisma.visitor.findUnique({ where: { id: visitorId } });
    expect(visitor?.country).toBe('Uruguay');
    expect(visitor?.region).toBe('Montevideo');
    expect(visitor?.city).toBe('Montevideo');
    expect(visitor?.latitude).toBeCloseTo(-34.9011, 3);
    expect(visitor?.longitude).toBeCloseTo(-56.1645, 3);
    expect(visitor?.ipAddress).not.toBeNull();
  });

  test('✅ Debe calcular métricas agregadas del business', async () => {
    const sessions = await prisma.session.createManyAndReturn({ data: Array.from({ length: 3 }, () => ({ id: uuidv4(), sessionId: uuidv4(), businessId: testBusinessId, visitorId, duration: 100 })) });
    const sessionIds = sessions.map(s => s.id);

    await prisma.trackingEvent.createMany({ data: Array.from({ length: 12 }, (_, i) => ({ id: uuidv4(), businessId: testBusinessId, visitorId, sessionId: sessionIds[i % sessionIds.length], eventType: 'generic_event', pageUrl: 'https://innova-marketing.com/test-page' })) });
    await prisma.visitor.update({ where: { id: visitorId }, data: { pageViews: 9, engagementScore: 50 } });

        const visitorCount = await prisma.visitor.count({ where: { businessId: testBusinessId, id: visitorId } });
    const sessionCount = await prisma.session.count({ where: { businessId: testBusinessId, visitorId: visitorId } });
    const eventCount = await prisma.trackingEvent.count({ where: { businessId: testBusinessId, visitorId: visitorId } });

    const visitorData = await prisma.visitor.findUnique({ where: { id: visitorId } });
    const sessionsData = await prisma.session.findMany({ where: { visitorId: visitorId } });

    expect(visitorCount).toBe(1);
    expect(sessionCount).toBe(3);
    expect(eventCount).toBe(12);

    const totalDuration = sessionsData.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
    const avgSessionDuration = totalDuration / (sessionsData.length || 1);
    const totalPageViews = visitorData?.pageViews || 0;
    const avgEngagement = visitorData?.engagementScore || 0;

    expect(avgSessionDuration).toBe(100);
    expect(totalPageViews).toBe(9);
    expect(avgEngagement).toBe(50);
  });
});
