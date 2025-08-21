import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Create business endpoint (temporary for setup)
 */
router.post('/create-business', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Creando business de Innova Marketing...');
    
    const business = await prisma.business.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Innova Marketing',
        subdomain: 'innova-marketing',
        isActive: true
      }
    });

    console.log('✅ Business creado exitosamente:', business);
    
    res.status(200).json({
      success: true,
      message: 'Business creado exitosamente',
      business: business
    });
    
  } catch (error: any) {
    console.error('❌ Error creando business:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    
    // Test query simple
    const dbStatus = await prisma.$queryRaw`SELECT 1 as test`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error: any) {
    console.error('❌ [HEALTH] Error en health check:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

/**
 * Database status endpoint
 */
router.get('/db', async (req: Request, res: Response) => {
  try {
    // Verificar conexión y obtener estadísticas básicas
    await prisma.$connect();
    
    const stats = {
      visitors: await prisma.visitor.count(),
      sessions: await prisma.session.count(),
      events: await prisma.trackingEvent.count(),
      leads: await prisma.lead.count(),
      activeSessions: await prisma.session.count({
        where: { endedAt: null }
      })
    };
    
    res.status(200).json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      stats
    });
    
  } catch (error: any) {
    console.error('❌ [HEALTH] Error verificando base de datos:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
