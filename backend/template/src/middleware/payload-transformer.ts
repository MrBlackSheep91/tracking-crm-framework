/**
 * MIDDLEWARE DE VALIDACIÓN DE PAYLOADS
 * Este middleware reemplaza al antiguo transformador.
 * Su única responsabilidad es verificar que el payload entrante
 * cumple con la estructura moderna y rechazar cualquier otro formato.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar la estructura del payload moderno.
 * No transforma, solo valida la presencia de campos clave.
 */
export function modernPayloadValidator(req: Request, res: Response, next: NextFunction) {
  const { body } = req;

  // El formato moderno debe tener 'sessionData' y 'events'.
  if (body && body.sessionData && Array.isArray(body.events)) {
    console.log('✅ [PAYLOAD VALIDATOR] Payload moderno detectado. Pasando al siguiente middleware.');
    // El payload ya es plano y correcto: conservar `sessionData` para la validación Joi.
    req.body = {
      sessionData: body.sessionData,
      events: body.events
    };
    return next();
  }

  // Para endpoints que no son de eventos en lote (ej. leads, heartbeat)
  // podríamos querer dejarlos pasar si no coinciden con el formato de evento.
  // Por ahora, si no es un payload de eventos válido, lo rechazamos.
  console.warn('⚠️ [PAYLOAD VALIDATOR] Payload no cumple con la estructura moderna (sessionData + events).');
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_PAYLOAD_STRUCTURE',
      message: 'El payload debe contener los campos `sessionData` y `events`. El formato legacy ya no es soportado.',
    },
  });
}

/**
 * Validador para payloads de heartbeat.
 * Asegura que el payload de heartbeat sea plano y no use wrappers.
 */
export function heartbeatValidator(req: Request, res: Response, next: NextFunction) {
  const { body } = req;

  // El formato de heartbeat moderno debe ser plano.
  if (body && body.sessionId && body.visitorId && body.businessId) {
    console.log('✅ [HEARTBEAT VALIDATOR] Payload de heartbeat moderno y válido.');
    return next();
  }

  console.warn('⚠️ [HEARTBEAT VALIDATOR] Payload de heartbeat inválido.');
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_HEARTBEAT_PAYLOAD',
      message: 'El payload de heartbeat es inválido o usa un formato obsoleto.',
    },
  });
}


