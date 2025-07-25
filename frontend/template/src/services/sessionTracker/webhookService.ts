/**
 * Servicio para el envío de datos a webhooks de n8n
 */
import type { SessionData } from './sessionTypes';
import { N8N_SESSION_WEBHOOK_URL, N8N_HEARTBEAT_WEBHOOK_URL } from './sessionTypes';

/**
 * Envía datos al servidor usando fetch con retry
 * @param url URL del webhook
 * @param data Datos a enviar
 * @param maxRetries Número máximo de reintentos
 * @returns Promesa que resuelve a true si el envío fue exitoso
 */
export const sendDataToServer = async (
  url: string, 
  data: SessionData, 
  maxRetries = 3
): Promise<boolean> => {
  console.log(`Intentando enviar datos a ${url}`);
  console.log('Payload:', JSON.stringify(data));

  // En entorno local (desarrollo), solo loggear y simular éxito
  if (window.location.hostname === 'localhost') {
    console.log(`[DEV] Simulando envío exitoso a ${url} (entorno local)`);
    return true;
  }

  // Función para intentar el envío
  const attemptSend = async (retries: number): Promise<boolean> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Headers para CORS
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Error de servidor: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`Datos enviados exitosamente a ${url}`);
      console.log('Respuesta:', JSON.stringify(result));
      return true;
    } catch (error) {
      console.error(`Intento ${maxRetries - retries + 1} fallido:`, error);
      
      if (retries <= 1) {
        return false;
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      const delay = Math.pow(2, maxRetries - retries + 1) * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      return attemptSend(retries - 1);
    }
  };

  return attemptSend(maxRetries);
};

/**
 * Envía datos de inicio de sesión
 * @param sessionData Datos de la sesión
 */
export const sendSessionStart = async (sessionData: SessionData): Promise<boolean> => {
  return await sendDataToServer(N8N_SESSION_WEBHOOK_URL, {
    ...sessionData,

  });
};

/**
 * Envía datos de fin de sesión
 * @param sessionData Datos de la sesión
 */
export const sendSessionEnd = async (sessionData: SessionData): Promise<boolean> => {
  return await sendDataToServer(N8N_SESSION_WEBHOOK_URL, {
    ...sessionData,

  });
};

/**
 * Envía datos de heartbeat
 * @param sessionData Datos de la sesión
 */
export const sendHeartbeat = async (sessionData: SessionData): Promise<boolean> => {
  return await sendDataToServer(N8N_HEARTBEAT_WEBHOOK_URL, {
    ...sessionData,

  });
};
