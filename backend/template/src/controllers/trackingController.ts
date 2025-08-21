import { Request, Response, NextFunction } from 'express';
import { processTrackEvent } from '../services/trackingService';

export const handleBatchEvents = async (req: Request, res: Response) => {
  try {
    console.log('[BATCH EVENTS] Raw payload received:', JSON.stringify(req.body, null, 2));
    
    // Estructura correcta: sessionData + events (ya validada por middleware Joi)
    const { sessionData, events } = req.body;
    const businessId = sessionData.businessId;

    console.log(`[BATCH EVENTS] Processing batch for businessId: ${businessId}, events: ${events.length}`);
    
    // Crear payload normalizado para trackingService
    const normalizedPayload = {
      ...sessionData,
      events,
      businessId
    };

    const result = await processTrackEvent(normalizedPayload);
    
    res.status(200).json({ 
      success: true, 
      processed: events.length,
      message: result.message 
    });
  } catch (error: any) {
    console.error('[BATCH EVENTS] Error:', error.message);
    console.error('[BATCH EVENTS] Stack trace:', error.stack);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal Server Error';
    res.status(statusCode).json({ success: false, message });
  }
};

export const handleHeartbeat = async (req: Request, res: Response) => {
  try {
    console.log('[HEARTBEAT] Payload recibido:', JSON.stringify(req.body, null, 2));
    // Validado por middleware Joi. Aquí podríamos persistir métricas livianas.
    res.status(200).json({ success: true, message: 'Heartbeat recibido' });
  } catch (error: any) {
    console.error('[HEARTBEAT] Error:', error.message);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal Server Error';
    res.status(statusCode).json({ success: false, message });
  }
};

export const handleSessionEnd = async (req: Request, res: Response) => {
  try {
    console.log('[SESSION END] Payload recibido:', JSON.stringify(req.body, null, 2));
    // Validado por middleware Joi. Futuro: actualizar endedAt/duración en DB.
    res.status(200).json({ success: true, message: 'Session end recibido' });
  } catch (error: any) {
    console.error('[SESSION END] Error:', error.message);
    const statusCode = error.statusCode || 500;
    const message = error.statusCode ? error.message : 'Internal Server Error';
    res.status(statusCode).json({ success: false, message });
  }
};

