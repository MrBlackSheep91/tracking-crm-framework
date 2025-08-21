import { PrismaClient } from '@prisma/client';

export class MetricsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getMetrics() {
    // Lógica para obtener métricas, por ejemplo, contar eventos
    const eventCount = await this.prisma.trackingEvent.count();
    return { totalEvents: eventCount };
  }

  async getRealtimeStats(businessId: number) {
    const activeVisitors = await this.prisma.visitor.count({
      where: {
        businessId: businessId.toString(),
        lastVisitAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // últimos 5 minutos
        }
      }
    });
    return { activeVisitors };
  }

  async getAggregatedMetrics(
    businessId: number, 
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    fromDate?: Date,
    toDate?: Date
  ) {
    const endDate = toDate || new Date();
    let startDate = fromDate;
    
    if (!startDate) {
      switch (period) {
        case 'hour':
          startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const totalEvents = await this.prisma.trackingEvent.count({
      where: { 
        businessId: businessId.toString(),
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalVisitors = await this.prisma.visitor.count({
      where: { 
        businessId: businessId.toString(),
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const newVisitors = await this.prisma.visitor.count({
      where: { 
        businessId: businessId.toString(),
        firstVisitAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const returningVisitors = totalVisitors - newVisitors;

    const totalSessions = await this.prisma.session.count({
      where: { 
        businessId: businessId.toString(),
        startedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const sessions = await this.prisma.session.findMany({
      where: {
        businessId: businessId.toString(),
        startedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        duration: true,
        pagesViewed: true
      }
    });

    const avgDuration = sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + Number(s.duration || 0), 0) / sessions.length / 60)
      : 0;

    const avgPageViews = sessions.length > 0
      ? Math.round((sessions.reduce((sum, s) => sum + (Array.isArray(s.pagesViewed) ? s.pagesViewed.length : 0), 0) / sessions.length) * 100) / 100
      : 0;

    return {
      visitors: {
        total: totalVisitors,
        new: newVisitors,
        returning: returningVisitors,
        online: await this.getRealtimeStats(businessId).then(r => r.activeVisitors)
      },
      sessions: {
        total: totalSessions,
        active: await this.getRealtimeStats(businessId).then(r => r.activeVisitors),
        avgDuration,
        avgPageViews
      },
      events: {
        total: totalEvents,
        pageViews: await this.prisma.trackingEvent.count({
          where: { 
            businessId: businessId.toString(),
            eventType: 'page_view',
            timestamp: { gte: startDate, lte: endDate }
          }
        }),
        interactions: await this.prisma.trackingEvent.count({
          where: { 
            businessId: businessId.toString(),
            eventType: { in: ['universal_click', 'form_interaction'] },
            timestamp: { gte: startDate, lte: endDate }
          }
        }),
        conversions: await this.prisma.trackingEvent.count({
          where: { 
            businessId: businessId.toString(),
            conversionSuccess: true,
            timestamp: { gte: startDate, lte: endDate }
          }
        })
      },
      engagement: {
        avgScrollDepth: 65, // Placeholder
        highEngagementVisitors: Math.floor(totalVisitors * 0.3),
        avgEngagementScore: 75, // Placeholder
        bounceRate: 45 // Placeholder
      },
      timeRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        period
      }
    };
  }

  async getMetricsByPeriod(
    businessId: number,
    metric: 'visitors' | 'sessions' | 'pageViews' | 'events',
    period: 'hour' | 'day' | 'week',
    days: number
  ) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Generar datos de ejemplo por simplicidad
    const data = [];
    const intervals = days * (period === 'hour' ? 24 : 1);
    
    for (let i = 0; i < intervals; i++) {
      const value = Math.floor(Math.random() * 100) + 20; // Datos de ejemplo
      data.push({
        timestamp: new Date(startDate.getTime() + i * (period === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)),
        value
      });
    }

    return data;
  }

  async getVisitorMetrics(visitorId: string, businessId: number) {
    const visitor = await this.prisma.visitor.findUnique({
      where: { 
        visitorId_businessId: {
          visitorId: visitorId,
          businessId: businessId.toString()
        }
      },
      select: {
        sessionsCount: true,
        totalTimeOnSite: true,
        pageViews: true,
        engagementScore: true
      }
    });

    return visitor || {
      sessionsCount: 0,
      totalTimeOnSite: 0,
      pageViews: 0,
      engagementScore: 0
    };
  }
}