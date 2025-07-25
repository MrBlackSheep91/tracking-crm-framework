// 🚀 ENHANCED SERVER INTEGRATION - Compatible con tus micro-workflows
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// 🎯 MICRO-WORKFLOW URLS
export const MICROWORKFLOW_URLS = {
  VISITOR_PROCESSOR: process.env.VISITOR_PROCESSOR_URL || 'http://n8n:5678/webhook/visitor-processor',
  LEAD_PROCESSOR: process.env.LEAD_PROCESSOR_URL || 'http://n8n:5678/webhook/lead-processor',
  CONVERSION_DETECTOR: process.env.CONVERSION_DETECTOR_URL || 'http://n8n:5678/webhook/conversion-detector',
  ACTIVITY_LOGGER: process.env.ACTIVITY_LOGGER_URL || 'http://n8n:5678/webhook/activity-logger'
};

const SESSION_TIMEOUT_MS = 30000; // 30 segundos de gracia
const PORT = 3001;

// El Map ahora almacena el payload completo que viene del frontend.
const activeSessions: Map<string, { session: any; events: any[]; timer?: NodeJS.Timeout }> = new Map();

import { routePayload } from './payloadRouter'; // Import the new router

export async function sendToMicroWorkflow(url: string, payload: any, workflowName: string, retries = 3, delay = 1000) {
  try {
    console.log(`🚀 Enviando a ${workflowName}:`, JSON.stringify(payload, null, 2));
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30 segundos timeout
    });
    
    console.log(`✅ Respuesta de ${workflowName}:`, response.status, response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Error en ${workflowName} (${error.response.status}):`, error.response.data);
    } else {
      console.error(`🔥 Error de red en ${workflowName}:`, error.message);
    }
    
    if (retries > 0) {
      console.log(`🔄 Reintentando ${workflowName} en ${delay}ms... (${retries} intentos restantes)`);
      await new Promise(res => setTimeout(res, delay));
      return sendToMicroWorkflow(url, payload, workflowName, retries - 1, delay * 2);
    }
    
    console.error(`💥 Fallo definitivo en ${workflowName} después de varios reintentos.`);
    return { success: false, error: error.message };
  }
}

async function endSession(sessionId: string) {
  const sessionEntry = activeSessions.get(sessionId);
  if (sessionEntry) {
    // Limpiar el temporizador de seguridad si existe
    if (sessionEntry.timer) {
      clearTimeout(sessionEntry.timer);
    }

    console.log(`🏁 Finalizando sesión ${sessionId}. Eventos a enviar: ${sessionEntry.events.length}`);

    // El payload es exactamente lo que hemos ido guardando.
    const payload = {
      session: sessionEntry.session,
      events: sessionEntry.events,
    };

    // 🧠 Usar routing inteligente
    const result = await routePayload(payload);
    
    activeSessions.delete(sessionId);
    console.log(`✅ Sesión ${sessionId} procesada y eliminada de la memoria.`);
    
    return result;
  }
  
  // Return para el caso donde no existe la sesión
  console.log(`⚠️ Sesión ${sessionId} no encontrada en memoria activa`);
  return { success: false, error: `Session ${sessionId} not found` };
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // Desarrollo local
    'http://localhost:3000', // Alternativa local
    'https://nat-pets.com',   // Producción
    'https://web.nat-pets.com' // Tu dominio web
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Aumentar límite para payloads grandes

// Endpoint de salud mejorado
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeSessions: activeSessions.size,
    microworkflows: Object.keys(MICROWORKFLOW_URLS),
    version: '2.0-microworkflows'
  });
});

// 🆕 NUEVO: Endpoint para payloads de leads directos
app.post('/api/lead', async (req: Request, res: Response) => {
  try {
    console.log('📧 Recibido payload de lead directo');
    
    const result = await routePayload(req.body);
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Lead procesado exitosamente',
        data: result.data 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Error procesando lead',
        details: result.error 
      });
    }
  } catch (error: any) {
    console.error('💥 Error procesando lead:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint mejorado para recibir el payload completo del frontend
app.post('/api/track', async (req: Request, res: Response) => {
  try {
    const { session: incomingSession, events: incomingEvents } = req.body;

    // Validación básica del payload
    if (!incomingSession || !incomingSession.sessionId) {
      return res.status(400).json({ error: 'Payload inválido: session.sessionId es requerido.' });
    }

    const { sessionId } = incomingSession;

    // Si es un evento de final de sesión, lo enviamos directamente y terminamos.
    const endEvent = incomingEvents?.find((e: any) => e.eventName === 'session_end' || e.eventType === 'session_end');
    if (endEvent) {
      console.log(`🏁 Recibido evento 'session_end' para ${sessionId}. Procesando...`);
      
      // Asegurarnos de tener todos los eventos hasta el momento
      const finalSessionEntry = activeSessions.get(sessionId) || { session: incomingSession, events: [] };
      const allEvents = [...finalSessionEntry.events, ...incomingEvents];
      
      // Eliminar duplicados por si acaso
      const uniqueEvents = Array.from(new Map(allEvents.map(e => [JSON.stringify(e), e])).values());
      
      // Actualizar el entry con todos los eventos
      finalSessionEntry.events = uniqueEvents;
      activeSessions.set(sessionId, finalSessionEntry);

      const result = await endSession(sessionId);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Sesión finalizada y enviada.',
        result: result
      });
    }

    let sessionEntry = activeSessions.get(sessionId);

    if (!sessionEntry) {
      console.log(`🆕 Creando nueva sesión en memoria: ${sessionId}`);
      sessionEntry = { session: incomingSession, events: [] };
      activeSessions.set(sessionId, sessionEntry);
    } else {
      // Actualizar siempre los datos de la sesión con los más recientes del frontend
      sessionEntry.session = incomingSession;
    }

    // Añadir los nuevos eventos al historial de la sesión
    if (incomingEvents && Array.isArray(incomingEvents)) {
      sessionEntry.events.push(...incomingEvents);
    }

    // Reiniciar el temporizador de seguridad del backend
    if (sessionEntry.timer) {
      clearTimeout(sessionEntry.timer);
    }

    sessionEntry.timer = setTimeout(() => {
      console.log(`⏰ Sesión ${sessionId} inactiva (timeout de seguridad del backend). Finalizando.`);
      endSession(sessionId);
    }, SESSION_TIMEOUT_MS);

    return res.status(200).json({ 
      success: true, 
      sessionId, 
      eventsReceived: incomingEvents?.length || 0,
      totalEvents: sessionEntry.events.length
    });

  } catch (error: any) {
    console.error('💥 Error procesando evento de seguimiento:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 🆕 NUEVO: Endpoint para testing de micro-workflows
app.post('/api/test-microworkflow', async (req: Request, res: Response) => {
  try {
    const { workflow, payload } = req.body;
    
    if (!workflow || !MICROWORKFLOW_URLS[workflow as keyof typeof MICROWORKFLOW_URLS]) {
      return res.status(400).json({ 
        error: 'Workflow inválido', 
        available: Object.keys(MICROWORKFLOW_URLS) 
      });
    }
    
    const url = MICROWORKFLOW_URLS[workflow as keyof typeof MICROWORKFLOW_URLS];
    const result = await sendToMicroWorkflow(url, payload, workflow);
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('💥 Error en test de micro-workflow:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 🆕 NUEVO: Endpoint para stats del sistema
app.get('/api/stats', (req, res) => {
  res.status(200).json({
    activeSessions: activeSessions.size,
    sessionDetails: Array.from(activeSessions.entries()).map(([id, entry]) => ({
      sessionId: id,
      events: entry.events.length,
      lastUpdate: entry.session.updatedAt || 'unknown'
    })),
    microworkflows: MICROWORKFLOW_URLS,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Iniciar el servidor
console.log('🚀 Attempting to start Enhanced Server v2.0...');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de seguimiento MEJORADO ejecutándose en http://0.0.0.0:${PORT}`);
  console.log('🎯 Micro-workflows configurados:', Object.keys(MICROWORKFLOW_URLS));
  console.log('📊 Endpoints disponibles:');
  console.log('   - POST /api/track (visitor tracking)');
  console.log('   - POST /api/lead (direct lead capture)'); 
  console.log('   - POST /api/test-microworkflow (testing)');
  console.log('   - GET /health (health check)');
  console.log('   - GET /api/stats (system stats)');
});

// Manejar cierre limpio
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
