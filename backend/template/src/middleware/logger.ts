import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para logging de requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, ip } = req;

  // Log del request entrante
  console.log(`🌐 [${method}] ${url} - IP: ${ip} - ${new Date().toISOString()}`);

  // Override del res.json para capturar la respuesta
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Determinar el emoji basado en el status code
    let statusEmoji = '✅';
    if (statusCode >= 400 && statusCode < 500) statusEmoji = '⚠️';
    if (statusCode >= 500) statusEmoji = '❌';
    
    // Log de la respuesta
    console.log(`${statusEmoji} [${method}] ${url} - ${statusCode} - ${duration}ms`);
    
    // Si es un error, log más detalles
    if (statusCode >= 400) {
      console.log(`   Error: ${data.error || data.message || 'Unknown error'}`);
    }
    
    // Llamar al método original
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Logger específico para tracking
 */
export const trackingLogger = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  
  // Log específico para payloads de tracking
  if (body && body.body && body.body.session) {
    const { sessionId, visitorId } = body.body.session;
    const eventsCount = body.body.events ? body.body.events.length : 0;
    
    console.log(`📊 [TRACKING] Session: ${sessionId?.substring(0, 8)}... | Visitor: ${visitorId?.substring(0, 8)}... | Events: ${eventsCount}`);
  }
  
  next();
};

/**
 * Logger específico para leads
 */
export const leadLogger = (req: Request, res: Response, next: NextFunction) => {
  const { body } = req;
  
  // Log específico para leads
  if (body && (body.email || body.phone)) {
    const identifier = body.email || body.phone || 'anonymous';
    const source = body.source || 'unknown';
    
    console.log(`👤 [LEAD] ${identifier} | Source: ${source} | Form: ${body.formType || 'generic'}`);
  }
  
  next();
};

/**
 * Logger de performance para endpoints críticos
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convertir a milliseconds
    
    // Log si tarda más de 100ms
    if (duration > 100) {
      console.log(`⏱️  [PERFORMANCE] ${req.method} ${req.url} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};
