import { v4 as uuidv4 } from 'uuid';

/**
 * 🛠️ HELPERS PARA GENERAR EVENTOS VÁLIDOS
 * Funciones centralizadas para crear eventos con todos los campos obligatorios
 */

export interface ValidEventData {
  eventType: string;
  pageUrl: string;
  eventCategory?: string;
  eventAction?: string;
  eventData?: Record<string, any>;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Genera un evento válido con todos los campos obligatorios
 */
export const createValidEvent = (overrides: Partial<ValidEventData> = {}): ValidEventData => {
  return {
    eventType: 'pageview',
    pageUrl: 'https://innova-marketing.com/',
    eventCategory: 'navigation',
    eventAction: 'view',
    timestamp: new Date().toISOString(),
    eventData: {
      startedAt: new Date().toISOString(),
      referrer: 'direct',
      utmSource: '',
      utmCampaign: ''
    },
    ...overrides
  };
};

/**
 * Genera múltiples eventos válidos
 */
export const createValidEvents = (count: number, baseOverrides: Partial<ValidEventData> = {}): ValidEventData[] => {
  const eventTypes = ['pageview', 'click', 'scroll', 'form_interaction', 'heartbeat'];
  
  return Array.from({ length: count }, (_, i) => 
    createValidEvent({
      ...baseOverrides,
      eventType: eventTypes[i % eventTypes.length],
      eventAction: `action_${i}`,
      eventData: {
        startedAt: new Date().toISOString(),
        referrer: 'direct',
        utmSource: '',
        utmCampaign: '',
        index: i
      }
    })
  );
};

/**
 * Crea un payload de sesión base válido
 */
export const createValidSession = (visitorId: string, sessionId: string, businessId: number) => ({
  visitorId,
  sessionId,
  businessId,
  fingerprint: `fp_${visitorId}`,
  startedAt: new Date().toISOString(),
  deviceInfo: {
    type: 'desktop',
    os: 'Windows',
    browser: 'Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceType: 'desktop',
    browserVersion: '120',
    operatingSystem: 'Windows',
    osVersion: '10',
    screenResolution: '1920x1080',
    timezone: 'America/Montevideo',
    language: 'es-419'
  },
  ipLocation: {
    country: 'Uruguay',
    city: 'Montevideo',
    region: 'Montevideo',
    latitude: -34.9011,
    longitude: -56.1645,
    timezone: 'America/Montevideo'
  },
  pageInfo: {
    url: 'https://innova-marketing.com/',
    title: 'Innova Marketing',
    referrer: 'direct',
    pathname: '/',
    search: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: ''
  },
  userBehavior: {
    sessionDuration: 1000,
    engagementScore: 50,
    pageViewDuration: 0,
    timeOnPage: 0,
    maxScrollPercentage: 0,
    currentScrollPercentage: 0,
    scrollDirection: 'none',
    scrollSpeed: 0,
    attentionMap: {},
    clickCount: 0,
    keyboardEvents: 0,
    mouseMovements: 0,
    focusEvents: 0,
    attentionScore: 0,
    interactionScore: 0,
    isActive: true,
    lastActivityAt: Date.now(),
    timeSinceLastActivity: 0,
    inactivityCount: 0,
    totalInactiveTime: 0,
    visibilityChanges: 0,
    timeHidden: 0,
    timeVisible: 0
  }
});

/**
 * Crea un payload completo válido con eventos
 */
export const createValidPayload = (
  visitorId: string, 
  sessionId: string, 
  businessId: number, 
  events: ValidEventData[] = []
) => ({
  type: 'batch_events',
  session: createValidSession(visitorId, sessionId, businessId),
  events: events.length > 0 ? events : [createValidEvent()]
});

/**
 * Crea un evento inválido específico para testing de validación
 */
export const createInvalidEvent = (missingField: 'eventType' | 'pageUrl' = 'eventType') => {
  const baseEvent = createValidEvent();
  delete (baseEvent as any)[missingField];
  return baseEvent;
};
