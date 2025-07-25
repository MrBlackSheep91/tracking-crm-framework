// Importar con tipo personalizado desde nuestra declaración
import ReactPixel from 'react-facebook-pixel';
import { getUtmParams } from '../utils/urlUtils';

/**
 * Redirecciona a Stripe con seguimiento de origen
 * @param buttonSource Origen del botón que inició la compra
 */
export const redirectToStripeWithTracking = (buttonSource: string) => {
  // Evento de inicio de compra
  ReactPixel.track('InitiateCheckout', {
    content_name: 'E-book de recetas naturales para perros',
    content_category: 'product',
    content_ids: ['price_1RdHVjCfiTJFtDrsT9gm4CDF'],
    value: 15.00,
    currency: 'USD',
    num_items: 1,
    conversion_source: buttonSource
  });
  
  // Evento de compra (se registrará al intentar la compra)
  ReactPixel.track('Purchase', {
    content_name: 'E-book de recetas naturales para perros',
    content_category: 'product',
    content_ids: ['price_1RdHVjCfiTJFtDrsT9gm4CDF'],
    value: 15.00,
    currency: 'USD',
    num_items: 1,
    conversion_source: buttonSource
  });
  
  // Obtener parámetros UTM desde el sistema centralizado de UTM
  const utmParams = getUtmParams();
  const source = utmParams.utm_source || 'direct';
  const medium = utmParams.utm_medium || 'none';
  const campaign = utmParams.utm_campaign || 'none';
  
  // Generar referencia personalizada según el origen
  const customReference = `KimElon_${source}_${medium}_${campaign}_${buttonSource}_${Date.now()}`;
  
  // Redirigir a Stripe con la referencia personalizada
  window.location.href = `https://buy.stripe.com/28o4iZ0NI95R8N2cMN?prefilled_email=${encodeURIComponent(localStorage.getItem('userEmail') || '')}&client_reference_id=${customReference}`;
};

/**
 * Maneja el click en el botón de WhatsApp
 * @param buttonLocation Ubicación del botón que fue clickeado
 */
export const trackWhatsAppInteraction = async (buttonLocation: string) => {
  try {
    // Registrar evento de WhatsApp en Meta Pixel
    ReactPixel.track('Contact', {
      content_name: 'WhatsApp Click',
      content_category: 'contact',
      content_ids: ['whatsapp_click'],
      location: buttonLocation
    });
    
    // Obtener el ID de lead almacenado (si existe)
    const leadId = localStorage.getItem('leadId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (leadId && userEmail) {
          // Importar configuración centralizada
    const { N8N_WEBHOOKS } = await import('../config/tracking-config.js');
    
      // Enviar datos al webhook para actualizar el registro en la base de datos
    const response = await fetch(N8N_WEBHOOKS.whatsappTracking, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          email: userEmail,
          timestamp: new Date().toISOString(),
          buttonLocation,
          source: document.referrer || 'direct',
          device: navigator.userAgent
        })
      });
      
      if (response.ok) {
        console.log('Interacción de WhatsApp registrada correctamente');
      }
    }
    
    // Abrir WhatsApp
    const phoneNumber = '5491135708019';
    const message = "Hola, acabo de ver la página de NAT-PETS CRM y tengo algunas preguntas sobre sus servicios...";
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  } catch (error) {
    console.error('Error al registrar interacción de WhatsApp:', error);
  }
};
