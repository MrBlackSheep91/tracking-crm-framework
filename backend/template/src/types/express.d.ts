/**
 * Extensiones de tipos para Express
 * Agrega propiedades personalizadas a los objetos Request
 */

declare global {
  namespace Express {
    interface Request {
      trackingPayloadType?: string;
      businessId?: number;
    }
  }
}

export {};
