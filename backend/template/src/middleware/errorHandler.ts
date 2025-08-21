import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para manejar rutas no encontradas
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Endpoint no encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware principal de manejo de errores
 * Migrado y mejorado desde tracking-api
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Si ya se envió la respuesta, delegar al manejador de errores por defecto
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Errores específicos de Prisma
  if (err.code === 'P2002') {
    statusCode = 400;
    message = 'Registro duplicado - este elemento ya existe';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Registro no encontrado';
  }

  if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Error de relación - referencia inválida';
  }

  if (err.code === 'P2014') {
    statusCode = 400;
    message = 'Error de relación requerida';
  }

  // Errores de validación de Joi
  if (err.details && Array.isArray(err.details)) {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
  }

  // Errores de conexión a base de datos
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Error de conexión a la base de datos';
  }

  // Log del error (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ [ERROR HANDLER]', {
      message: err.message,
      code: err.code,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code,
      details: err.details 
    })
  });
};
