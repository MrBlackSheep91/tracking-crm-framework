/**
 * Tipos compartidos para el sistema de tracking server-side
 */

export interface VisitorData {
  id?: string;
  fingerprint?: string;
  clientIP?: string;
  browser?: string;
  operatingSystem?: string;
  deviceType?: string;
  country?: string;
  city?: string;
  language?: string;
  email?: string; // Si está disponible (desde Lead)
  phone?: string; // Si está disponible (desde Lead)
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
}

export interface EventData {
  eventName: string;
  timestamp: number; // Unix timestamp
  url?: string;
  contentId?: string;
  contentName?: string;
  value?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface ServerTrackingResponse {
  success: boolean;
  platform: string; // 'meta', 'tiktok', etc.
  eventName: string;
  timestamp: number;
  error?: string;
  details?: any;
}
