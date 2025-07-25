/**
 * Endpoint para recibir eventos de tracking desde el cliente
 * y procesarlos con la API de server-side tracking
 */

import serverTracking from '../services/serverTracking';
import type { VisitorData, UTMData } from '../services/serverTracking/types';

/**
 * Procesa una solicitud de tracking desde el cliente
 * Esta función debe exponerse como endpoint API en tu framework
 * (Express, Next.js, etc.)
 */
export async function processTrackingRequest(req: any, res: any) {
  try {
    const {
      eventName,
      visitorData,
      utmData,
      url,
      timestamp,
      ...additionalData
    } = req.body;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere eventName'
      });
    }

    // Complementar datos del visitante con información del request
    const enrichedVisitorData: VisitorData = {
      ...visitorData,
      clientIP: req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               '',
      // Otros datos que se puedan extraer del request
    };

    // Enriquecer UTMs si es necesario
    const enrichedUtmData: UTMData = {
      ...utmData,
      // Otros datos que queramos añadir
    };

    // Enviar a todas las plataformas configuradas
    const results = await serverTracking.trackServerEvent(
      eventName,
      enrichedVisitorData,
      enrichedUtmData,
      {
        url,
        timestamp,
        ...additionalData
      }
    );

    // Devolver resultados al cliente
    return res.status(200).json({
      success: true,
      eventName,
      timestamp: Date.now(),
      results
    });
  } catch (error) {
    console.error('Error procesando solicitud de tracking:', error);
    return res.status(500).json({
      success: false,
      error: String(error)
    });
  }
}

/**
 * Helpers específicos para eventos comunes
 */

export async function processPageView(req: any, res: any) {
  try {
    const { visitorData, utmData, url } = req.body;
    const results = await serverTracking.trackServerPageView(visitorData, utmData, url);
    
    return res.status(200).json({
      success: true,
      eventName: 'PageView',
      timestamp: Date.now(),
      results
    });
  } catch (error) {
    console.error('Error procesando PageView:', error);
    return res.status(500).json({
      success: false,
      error: String(error)
    });
  }
}

export async function processViewContent(req: any, res: any) {
  try {
    const { visitorData, utmData, contentId, contentName } = req.body;
    const results = await serverTracking.trackServerViewContent(
      visitorData, 
      utmData, 
      contentId, 
      contentName
    );
    
    return res.status(200).json({
      success: true,
      eventName: 'ViewContent',
      timestamp: Date.now(),
      results
    });
  } catch (error) {
    console.error('Error procesando ViewContent:', error);
    return res.status(500).json({
      success: false,
      error: String(error)
    });
  }
}

export async function processPurchase(req: any, res: any) {
  try {
    const { visitorData, utmData, value, currency, orderId, contentId } = req.body;
    const results = await serverTracking.trackServerPurchase(
      visitorData, 
      utmData, 
      value, 
      currency, 
      orderId, 
      contentId
    );
    
    return res.status(200).json({
      success: true,
      eventName: 'Purchase',
      timestamp: Date.now(),
      results
    });
  } catch (error) {
    console.error('Error procesando Purchase:', error);
    return res.status(500).json({
      success: false,
      error: String(error)
    });
  }
}

export default {
  processTrackingRequest,
  processPageView,
  processViewContent,
  processPurchase
};
