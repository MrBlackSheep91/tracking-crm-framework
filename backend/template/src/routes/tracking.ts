import { Router } from 'express';
import { handleBatchEvents, handleHeartbeat, handleSessionEnd } from '../controllers/trackingController';
import { validateBatchEvents, validateHeartbeat, validateSessionEnd } from '../validation/tracking-schemas';

const router = Router();

// Ruta para recibir batch de eventos (frontend consolidado)
router.post('/event', validateBatchEvents, handleBatchEvents);

// Ruta para heartbeat de sesión
router.post('/heartbeat', validateHeartbeat, handleHeartbeat);

// Ruta para finalización de sesión
router.post('/session-end', validateSessionEnd, handleSessionEnd);

export default router;
