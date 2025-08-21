import { Router } from 'express';
import { handleBatchEvents } from '../controllers/trackingController';
import { validateBatchEvents } from '../validation/tracking-schemas';

const router = Router();

// Ruta para recibir batch de eventos (frontend consolidado)
router.post('/event', validateBatchEvents, handleBatchEvents);

export default router;
