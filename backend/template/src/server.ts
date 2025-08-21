// 🚀 TRACKING CRM FRAMEWORK SERVER
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import leadRouter from './routes/leads';
import healthRouter from './routes/health';
import resetRouter from './routes/reset';
// import metricsRouter from './routes/metrics'; // Temporalmente deshabilitado
import trackingRouter from './routes/tracking';
import { errorHandler, notFound } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// TRACKING CRM CONFIGURATION

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '50mb' }));

// CORS manual para desarrollo - headers directos
app.use((req: Request, res: Response, next: NextFunction) => {
  // Permitir cualquier origen para desarrollo
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin, X-Tracking-Client, x-business-id');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  console.log(`🌐 [CORS MANUAL] ${req.method} ${req.path} - Origin: ${req.get('origin')}`);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log(`🌐 [CORS MANUAL] Preflight OK for ${req.path}`);
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Middleware adicional eliminado - usar solo configuración CORS principal

// Rate limiting - Configuración ajustada para tracking normal
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests por minuto para desarrollo
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intente de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting para requests de tracking
  skip: (req) => {
    return req.path.startsWith('/api/track');
  }
});

// Aplicar rate limiting solo a endpoints que no sean de tracking
app.use('/api/leads', limiter);
app.use('/api/health', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para capturar errores de parseo de JSON
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('❌ Error de parseo de JSON:', err);
    return res.status(400).json({ success: false, error: 'JSON malformado' });
  }
  next();
});

// Request logging
app.use(requestLogger);

// Endpoint de salud simple para el healthcheck de Docker
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api/v1/track', trackingRouter);
app.use('/api/leads', leadRouter);
app.use('/api/health', healthRouter);
app.use('/api/reset', resetRouter);
// app.use('/api/metrics', metricsRouter); // Temporalmente deshabilitado

// Error handling
app.use(notFound);
app.use(errorHandler);

// Iniciar el servidor solo si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  console.log('🚀 Starting Tracking CRM Framework Server...');
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log('📊 Available route prefixes:');
    console.log(`   - /api/v1/track`);
    console.log(`   - /api/leads`);
    // console.log(`   - /api/metrics`);
    console.log(`   - /api/health`);
    console.log(`   - /api/reset`);
  });
}

export default app;

// Manejar cierre limpio
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
