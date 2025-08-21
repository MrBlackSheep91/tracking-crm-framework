import express, { Request, Response } from 'express';
import { MetricsService } from '../services/metricsService.js';

const router = express.Router();
const metricsService = new MetricsService();

console.log('📊 [METRICS API] Router inicializado correctamente');

// ============================================
// MIDDLEWARE DE VALIDACIÓN BUSINESS ID
// ============================================

function validateBusinessId(req: Request, res: Response, next: any) {
  const businessIdStr = req.params.businessId || req.query.businessId || req.body.businessId;
  
  if (!businessIdStr) {
    return res.status(400).json({
      success: false,
      message: 'businessId es requerido',
      timestamp: new Date().toISOString()
    });
  }

  // Validar que sea un número
  const businessId = parseInt(businessIdStr as string, 10);
  if (isNaN(businessId)) {
    return res.status(400).json({
      success: false,
      message: 'businessId debe ser un número válido',
      timestamp: new Date().toISOString()
    });
  }
  
  res.locals.businessId = businessId; // Guardar como number
  next();
}

// ============================================
// ENDPOINT: MÉTRICAS AGREGADAS POR PERÍODO
// ============================================

router.get('/aggregated/:businessId', validateBusinessId, async (req: Request, res: Response) => {
  try {
    console.log('📊 [METRICS AGGREGATED] Solicitando métricas agregadas...');
    
    const businessId = res.locals.businessId as number; // Ya validado como número por middleware
    const period = (req.query.period as 'hour' | 'day' | 'week' | 'month') || 'day';
    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined;

    const metrics = await metricsService.getAggregatedMetrics(
      businessId,
      period,
      fromDate,
      toDate
    );

    return res.status(200).json({
      success: true,
      message: 'Métricas agregadas obtenidas correctamente',
      data: metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS AGGREGATED] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas agregadas',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ENDPOINT: STATS EN TIEMPO REAL
// ============================================

router.get('/realtime/:businessId', validateBusinessId, async (req: Request, res: Response) => {
  try {
    console.log('⚡ [METRICS REALTIME] Solicitando stats en tiempo real...');
    
    const businessId = res.locals.businessId as number; // Ya validado como número por middleware
    const stats = await metricsService.getRealtimeStats(businessId);

    return res.status(200).json({
      success: true,
      message: 'Stats en tiempo real obtenidas correctamente',
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS REALTIME] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo stats en tiempo real',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ENDPOINT: MÉTRICAS HISTÓRICAS POR PERÍODO
// ============================================

router.get('/historical/:businessId/:metric', validateBusinessId, async (req: Request, res: Response) => {
  try {
    console.log('📈 [METRICS HISTORICAL] Solicitando métricas históricas...');
    
    const businessId = res.locals.businessId as number; // Ya validado como número por middleware
    const metric = req.params.metric as 'visitors' | 'sessions' | 'pageViews' | 'events';
    const period = (req.query.period as 'hour' | 'day' | 'week') || 'day';
    const days = parseInt(req.query.days as string) || 7;

    // Validar metric
    const validMetrics = ['visitors', 'sessions', 'pageViews', 'events'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        message: `Métrica inválida. Debe ser una de: ${validMetrics.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    const historicalData = await metricsService.getMetricsByPeriod(
      businessId,
      metric,
      period,
      days
    );

    return res.status(200).json({
      success: true,
      message: `Métricas históricas de ${metric} obtenidas correctamente`,
      data: {
        metric,
        period,
        days,
        values: historicalData
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS HISTORICAL] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas históricas',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ENDPOINT: DASHBOARD COMPLETO
// ============================================

// Endpoint con businessId como query param (para compatibilidad)
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    console.log('📊 [METRICS DASHBOARD] Solicitando datos completos de dashboard...');
    
    const businessIdStr = req.query.businessId as string;
    const visitorId = req.query.visitorId as string;

    if (!businessIdStr) {
      return res.status(400).json({ success: false, message: 'businessId es requerido' });
    }

    // Validar que sea un número
    const businessId = parseInt(businessIdStr, 10);
    if (isNaN(businessId)) {
      return res.status(400).json({ success: false, message: 'businessId debe ser un número válido' });
    }

    if (visitorId) {
      const visitor = await metricsService.getVisitorMetrics(visitorId, businessId);
      return res.status(200).json({
        success: true,
        message: 'Métricas del visitor obtenidas correctamente',
        data: {
          visitorId,
          summary: visitor || { sessionsCount: 0, totalTimeOnSite: 0, pageViews: 0, engagementScore: 0 },
        },
        timestamp: new Date().toISOString(),
      });
    }

    const realtimeStats = await metricsService.getRealtimeStats(businessId);

    return res.status(200).json({
      success: true,
      message: 'Dashboard completo generado correctamente',
      data: {
        summary: {
          realtime: realtimeStats
        },
        generatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS DASHBOARD] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generando dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/dashboard/:businessId', validateBusinessId, async (req: Request, res: Response) => {
  try {
    console.log('📊 [METRICS DASHBOARD] Solicitando datos completos de dashboard...');
    
    const businessId = res.locals.businessId as number; // Ya validado como número por middleware
    
    // Obtener todas las métricas en paralelo
    const [
      dailyMetrics,
      weeklyMetrics,
      realtimeStats,
      visitorsHistorical,
      eventsHistorical
    ] = await Promise.all([
      metricsService.getAggregatedMetrics(businessId, 'day'),
      metricsService.getAggregatedMetrics(businessId, 'week'),
      metricsService.getRealtimeStats(businessId),
      metricsService.getMetricsByPeriod(businessId, 'visitors', 'day', 7),
      metricsService.getMetricsByPeriod(businessId, 'events', 'hour', 1)
    ]);

    const dashboard = {
      summary: {
        today: dailyMetrics,
        thisWeek: weeklyMetrics,
        realtime: realtimeStats
      },
      charts: {
        visitorsLast7Days: visitorsHistorical,
        eventsLast24Hours: eventsHistorical
      },
      generatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Dashboard completo generado correctamente',
      data: dashboard,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS DASHBOARD] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generando dashboard',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ENDPOINT: MÉTRICAS DE ENGAGEMENT
// ============================================

router.get('/engagement/:businessId', validateBusinessId, async (req: Request, res: Response) => {
  try {
    console.log('💡 [METRICS ENGAGEMENT] Solicitando métricas de engagement...');
    
    const businessId = res.locals.businessId as number; // Ya validado como número por middleware
    const period = (req.query.period as 'day' | 'week' | 'month') || 'day';
    
    const metrics = await metricsService.getAggregatedMetrics(businessId, period);

    // Extraer solo métricas de engagement
    const engagementData = {
      engagement: metrics.engagement,
      visitors: {
        total: metrics.visitors.total,
        returning: metrics.visitors.returning,
        returnRate: metrics.visitors.total > 0 
          ? Math.round((metrics.visitors.returning / metrics.visitors.total) * 100 * 100) / 100
          : 0
      },
      sessions: {
        avgDuration: metrics.sessions.avgDuration,
        avgPageViews: metrics.sessions.avgPageViews
      },
      timeRange: metrics.timeRange
    };

    return res.status(200).json({
      success: true,
      message: 'Métricas de engagement obtenidas correctamente',
      data: engagementData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS ENGAGEMENT] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas de engagement',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ENDPOINT: HEALTH CHECK PARA MÉTRICAS
// ============================================

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test básico de conectividad
    const testBusinessId = 1; // Usar un ID de prueba
    await metricsService.getRealtimeStats(testBusinessId);

    return res.status(200).json({
      success: true,
      message: 'Servicio de métricas funcionando correctamente',
      service: 'metrics-api',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS HEALTH] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en servicio de métricas',
      service: 'metrics-api',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ENDPOINT: EXPORTAR MÉTRICAS (CSV/JSON)
// ============================================

router.get('/export/:businessId', validateBusinessId, async (req: Request, res: Response) => {
  try {
    console.log('📤 [METRICS EXPORT] Exportando métricas...');
    
    const businessId = res.locals.businessId as number; // Ya validado como número por middleware
    const format = (req.query.format as 'json' | 'csv') || 'json';
    const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
    
    const metrics = await metricsService.getAggregatedMetrics(businessId, period);
    
    if (format === 'csv') {
      // Generar CSV básico
      const csv = [
        'Metric,Value,Period',
        `Total Visitors,${metrics.visitors.total},${period}`,
        `New Visitors,${metrics.visitors.new},${period}`,
        `Returning Visitors,${metrics.visitors.returning},${period}`,
        `Online Visitors,${metrics.visitors.online},${period}`,
        `Total Sessions,${metrics.sessions.total},${period}`,
        `Active Sessions,${metrics.sessions.active},${period}`,
        `Avg Session Duration (min),${metrics.sessions.avgDuration},${period}`,
        `Avg Page Views,${metrics.sessions.avgPageViews},${period}`,
        `Total Events,${metrics.events.total},${period}`,
        `Page Views,${metrics.events.pageViews},${period}`,
        `Interactions,${metrics.events.interactions},${period}`,
        `Conversions,${metrics.events.conversions},${period}`,
        `Avg Scroll Depth,${metrics.engagement.avgScrollDepth},${period}`,
        `High Engagement Visitors,${metrics.engagement.highEngagementVisitors},${period}`,
        `Avg Engagement Score,${metrics.engagement.avgEngagementScore},${period}`,
        `Bounce Rate,${metrics.engagement.bounceRate},${period}`
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="metrics_${businessId}_${period}.csv"`);
      return res.send(csv);
    }
    
    // Formato JSON por defecto
    return res.status(200).json({
      success: true,
      message: 'Métricas exportadas correctamente',
      format: 'json',
      data: metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ [METRICS EXPORT] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exportando métricas',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
