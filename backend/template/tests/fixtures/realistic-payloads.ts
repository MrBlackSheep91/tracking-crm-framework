import { v4 as uuidv4 } from 'uuid';

/**
 * 🎯 PAYLOADS REALISTAS PARA TESTING
 * Basados en la estructura real del frontend SessionManager y DataService
 */

// --- OBJETOS COMUNES REUTILIZABLES ---

const defaultDeviceInfo = {
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  deviceType: "desktop",
  browser: "Chrome",
  browserVersion: "120",
  operatingSystem: "Windows",
  osVersion: "10",
  screenResolution: "1920x1080",
  timezone: "America/Montevideo",
  language: "es-419"
};

const defaultIpLocation = {
  country: "Uruguay",
  region: "Montevideo",
  city: "Montevideo",
  latitude: -34.9011,
  longitude: -56.1645,
  timezone: "America/Montevideo"
};

const defaultPageInfo = {
  url: "https://innova-marketing.com/",
  title: "Innova Marketing - Automatización para Restaurantes",
  referrer: "https://google.com",
  pathname: "/",
  search: "?utm_source=google&utm_medium=cpc&utm_campaign=restaurantes",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "restaurantes",
  utmContent: "landing-principal",
  utmTerm: "marketing+restaurantes",
  utmParams: {
    source: "google",
    medium: "cpc",
    campaign: "restaurantes",
    content: "landing-principal",
    term: "marketing+restaurantes"
  }
};

const defaultUserBehavior = {
  sessionDuration: 0,
  pageViewDuration: 0,
  timeOnPage: 0,
  maxScrollPercentage: 0,
  currentScrollPercentage: 0,
  scrollDirection: "none",
  scrollSpeed: 0,
  attentionMap: {},
  clickCount: 0,
  keyboardEvents: 0,
  mouseMovements: 0,
  focusEvents: 0,
  engagementScore: 0,
  attentionScore: 0,
  interactionScore: 0,
  isActive: true,
  lastActivityAt: Date.now(),
  timeSinceLastActivity: 0,
  inactivityCount: 0,
  visibilityChanges: 0,
  timeHidden: 0,
  timeVisible: 0
};

// --- FUNCIONES GENERADORAS DE PAYLOADS ---

export const generateRealisticSessionStartPayload = (visitorId: string, sessionId: string, businessId: number) => ({
  sessionData: {
    sessionId,
    visitorId,
    businessId: businessId,
    fingerprint: `fp_${visitorId}`,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    deviceInfo: defaultDeviceInfo,
    ipLocation: defaultIpLocation,
    pageInfo: defaultPageInfo,
    userBehavior: defaultUserBehavior,
    isActive: true
  },
  events: [
    {
      eventType: "session_start",
      pageUrl: defaultPageInfo.url,
      timestamp: new Date().toISOString(),
      eventData: {
        startedAt: new Date().toISOString(),
        referrer: defaultPageInfo.referrer,
        utmSource: defaultPageInfo.utmSource,
        utmCampaign: defaultPageInfo.utmCampaign
      },
      metadata: {
        clientTimestamp: Date.now(),
        priority: "immediate",
        deviceType: "desktop",
        browser: "Chrome",
        os: "Windows"
      }
    }
  ]
});

export const generateRealisticLeadCapturePayload = (
  visitorId: string, 
  sessionId: string, 
  options: { 
    businessId: number; 
    leadType?: 'hot' | 'cold' | 'warm'; 
    leadScore?: number; 
    leadData?: { name: string; email: string; phone?: string; company?: string; [key: string]: any };
  }
) => {
  const { businessId, leadType = 'hot', leadScore = 85, leadData } = options;

  return {
    sessionData: {
      sessionId,
      visitorId,
      businessId: businessId,
      fingerprint: `fp_${visitorId}`,
      startedAt: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      lastActivityAt: new Date().toISOString(),
      deviceInfo: defaultDeviceInfo,
      ipLocation: defaultIpLocation,
      pageInfo: {
          ...defaultPageInfo,
          url: 'https://innova-marketing.com/contacto',
          title: 'Contacto - Innova Marketing',
          pathname: '/contacto',
      },
      userBehavior: {
          ...defaultUserBehavior,
          sessionDuration: 300000,
          clickCount: 3,
          engagementScore: 50,
      },
      isActive: true
    },
    events: [
      {
        id: uuidv4(),
        businessId: businessId,
        visitorId: visitorId,
        sessionId: sessionId,
        eventType: "conversion",
        pageUrl: "https://innova-marketing.com/contacto",
        eventCategory: "conversion",
        eventAction: "form_submit",
        pageTitle: "Contacto - Innova Marketing",
        timestamp: new Date().toISOString(),
        formId: "lead-capture-form",
        conversionType: "lead",
        conversionValue: 100,
        conversionSuccess: true,
        eventData: {
          ...(leadData || {
            email: "juan.perez@mirestaurante.com",
            name: "Juan Pérez",
            phone: "+59899123456",
            company: "Restaurante El Buen Sabor",
            tipoNegocio: "Restaurante",
            mensaje: "Necesito automatizar mi restaurante con 50 mesas",
          }),
          leadScore: leadScore,
          leadType: leadType
        },
        metadata: {
          clientTimestamp: Date.now(),
          priority: "immediate",
          deviceType: "desktop",
          conversionPath: ["landing", "pricing", "contact"],
          sessionDuration: 300000
        }
      }
    ]
  };
}
