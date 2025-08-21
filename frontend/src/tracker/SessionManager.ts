/**
 * 📊 SESSION MANAGER CONSOLIDADO
 * Gestión avanzada del ciclo de vida de sesiones con buffering inteligente
 * Combina la robustez del backend CRM con las mejoras del sistema Innova
 */

import { 
  generateUUID, 
  getUTMParams, 
  generateFingerprint, 
  getDeviceInfo
} from '../utils';
import { 
  TrackerConfig, 
  SessionData, 
  TrackingEvent, 
  SessionEndReason,
  EventCategory,
  UserBehavior
} from '../types';
import { DEFAULT_CONFIG } from '../config/defaults';
import { getEventPriority, isCriticalEvent } from '../config/criticalEvents';

export class SessionManager {
  private config: Required<TrackerConfig>;
  private currentSession: SessionData | null = null;
  private isSessionActive = false;
  private sessionEndedByInactivity = false;
  
  // Buffers híbridos por prioridad
  private immediateEventBuffer: TrackingEvent[] = [];    // Eventos críticos
  private batchEventBuffer: TrackingEvent[] = [];        // Eventos normales  
  
  // Timers para gestión de sesión
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private batchFlushTimer: ReturnType<typeof setInterval> | null = null;
  private immediateFlushTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Callbacks y funciones externas
  private onSessionEndCallback: ((sessionData: SessionData) => void) | null = null;
  private sendDataFunction: ((data: any) => Promise<boolean>) | null = null;
  
  constructor(config: Required<TrackerConfig>) {
    this.config = config;
    this.setupEventListeners();
  }

  // ==================== GESTIÓN DE SESIÓN ====================

  /**
   * Iniciar nueva sesión de tracking
   */
  async startSession(): Promise<SessionData> {
    if (this.isSessionActive && this.currentSession) {
      this.log('⚠️ [SESSION MANAGER] Sesión ya activa');
      return this.currentSession;
    }

    try {
      const sessionData = await this.createSessionData();
      this.currentSession = sessionData;
      this.isSessionActive = true;
      this.sessionEndedByInactivity = false;

      // Iniciar timers
      this.startHeartbeat();
      this.startInactivityMonitoring();
      this.startBatchProcessing();

      this.log('🚀 [SESSION MANAGER] Sesión iniciada:', sessionData.sessionId);

      // Trackear evento de inicio de sesión a través del buffer
      this.addEvent({
        eventId: generateUUID(),
        sessionId: sessionData.sessionId,
        visitorId: sessionData.visitorId,
        businessId: this.config.businessId,
        category: 'system',
        eventType: 'session',
        eventName: 'session_start',
        priority: 'immediate', // Asegurar envío rápido
        eventData: {
          // Incluir todos los datos de la sesión para el backend
          ...this.mapToBackendSchemas(sessionData)
        },
        timestamp: new Date().toISOString(),
        clientTimestamp: Date.now(),
        pageUrl: sessionData.pageInfo.url,
        pageTitle: sessionData.pageInfo.title,
        attempts: 0,
        sent: false,
      });

      return sessionData;

    } catch (error) {
      this.logError('❌ [SESSION MANAGER] Error iniciando sesión:', error);
      throw error;
    }
  }

  /**
   * Finalizar sesión actual
   */
  async endSession(reason: SessionEndReason = 'manual'): Promise<void> {
    if (!this.isSessionActive || !this.currentSession) {
      this.log('⚠️ [SESSION MANAGER] No hay sesión activa para finalizar');
      return;
    }

    try {
      // Actualizar datos de finalización
      const endTime = new Date().toISOString();
      this.currentSession.endedAt = endTime;
      this.currentSession.endReason = reason;
      this.currentSession.isActive = false;
      
      // Calcular duración final
      const startTime = new Date(this.currentSession.startedAt).getTime();
      const endTimeMs = new Date(endTime).getTime();
      this.currentSession.userBehavior.sessionDuration = endTimeMs - startTime;

      // Trackear evento de finalización de sesión a través del buffer
      this.addEvent({
        eventId: generateUUID(),
        sessionId: this.currentSession.sessionId,
        visitorId: this.currentSession.visitorId,
        businessId: this.config.businessId,
        category: 'system',
        eventType: 'session',
        eventName: 'session_end',
        priority: 'immediate', // Asegurar envío inmediato antes de cerrar
        eventData: {
          reason: reason,
          endedAt: endTime,
          totalDuration: this.currentSession.userBehavior.sessionDuration,
          finalPageUrl: this.currentSession.pageInfo.url,
          finalScrollDepth: this.currentSession.userBehavior.maxScrollPercentage,
        },
        timestamp: new Date().toISOString(),
        clientTimestamp: Date.now(),
        pageUrl: this.currentSession.pageInfo.url,
        pageTitle: this.currentSession.pageInfo.title,
        attempts: 0,
        sent: false,
      });

      // Enviar todos los datos pendientes
      await this.flushAllBuffers();

      // Detener timers
      this.stopAllTimers();

      this.log(`✅ [SESSION MANAGER] Sesión finalizada. Razón: ${reason}`);
      
      // Callback de finalización
      if (this.onSessionEndCallback) {
        this.onSessionEndCallback(this.currentSession);
      }

      this.isSessionActive = false;

    } catch (error) {
      this.logError('❌ [SESSION MANAGER] Error finalizando sesión:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE EVENTOS ====================

  /**
   * Agregar evento a la sesión con buffering inteligente
   */
  addEvent(event: TrackingEvent): void {
    if (!this.isSessionActive || !this.currentSession) {
      this.log('⚠️ [SESSION MANAGER] No hay sesión activa - evento ignorado');
      return;
    }

    try {
      // Determinar prioridad del evento
      event.priority = getEventPriority(event.eventType, event.eventName);
      
      // Agregar a sesión
      this.currentSession.events.push(event);
      
      // Actualizar actividad
      this.updateActivity();
      
      // Enrutar a buffer correcto según prioridad
      if (event.priority === 'immediate' || isCriticalEvent(event.eventType, event.eventName)) {
        this.immediateEventBuffer.push(event);
        this.scheduleImmediateFlush();
      } else {
        this.batchEventBuffer.push(event);
        this.checkBatchFlush();
      }

      this.log(`📊 [SESSION MANAGER] Evento agregado: ${event.eventName} (${event.priority})`);

    } catch (error) {
      this.logError('❌ [SESSION MANAGER] Error agregando evento:', error);
    }
  }

  /**
   * Actualizar comportamiento del usuario
   */
  updateUserBehavior(updates: Partial<UserBehavior>): void {
    if (!this.currentSession) return;

    this.currentSession.userBehavior = {
      ...this.currentSession.userBehavior,
      ...updates
    };

    // Actualizar timestamp de actividad
    this.currentSession.lastActivityAt = new Date().toISOString();
  }

  // ==================== GETTERS ====================

  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  getSessionId(): string | null {
    return this.currentSession?.sessionId || null;
  }

  public updateCurrentUrl(url: string): void {
    if (this.currentSession?.pageInfo) {
      this.currentSession.pageInfo.url = url;
      this.log(`[SESSION MANAGER] URL de sesión actualizada: ${url}`);
    }
  }

  public getVisitorId(): string | null {
    return this.currentSession?.visitorId || null;
  }

  isActive(): boolean {
    return this.isSessionActive;
  }

  // ==================== CONFIGURACIÓN ====================

  setSendDataFunction(fn: (data: any) => Promise<boolean>): void {
    this.sendDataFunction = fn;
  }

  private mapToBackendSchemas(sessionData: SessionData): { visitor: any, session: any } {
    const visitor = {
      visitorId: sessionData.visitorId,
      businessId: sessionData.businessId,
      fingerprint: sessionData.fingerprint,
      userAgent: sessionData.deviceInfo.userAgent,
      deviceType: sessionData.deviceInfo.deviceType,
      browser: sessionData.deviceInfo.browser,
      browserVersion: sessionData.deviceInfo.browserVersion,
      operatingSystem: sessionData.deviceInfo.operatingSystem,
      osVersion: sessionData.deviceInfo.osVersion,
      screenResolution: sessionData.deviceInfo.screenResolution,
      timezone: sessionData.deviceInfo.timezone,
      language: sessionData.deviceInfo.language,
      country: sessionData.ipLocation?.country,
      region: sessionData.ipLocation?.region,
      city: sessionData.ipLocation?.city,
      latitude: sessionData.ipLocation?.latitude,
      longitude: sessionData.ipLocation?.longitude,
      firstReferrer: sessionData.pageInfo.referrer, // Asumiendo que es la primera visita
      utmParams: {
        source: sessionData.pageInfo.utmSource,
        medium: sessionData.pageInfo.utmMedium,
        campaign: sessionData.pageInfo.utmCampaign,
        term: sessionData.pageInfo.utmTerm,
        content: sessionData.pageInfo.utmContent
      }
    };

    const session = {
      id: sessionData.sessionId,
      visitorId: sessionData.visitorId,
      businessId: sessionData.businessId,
      startedAt: sessionData.startedAt,
      userAgent: sessionData.deviceInfo.userAgent,
      deviceType: sessionData.deviceInfo.deviceType,
      browser: sessionData.deviceInfo.browser,
      browserVersion: sessionData.deviceInfo.browserVersion,
      operatingSystem: sessionData.deviceInfo.operatingSystem,
      osVersion: sessionData.deviceInfo.osVersion,
      screenResolution: sessionData.deviceInfo.screenResolution,
      language: sessionData.deviceInfo.language,
      country: sessionData.ipLocation?.country,
      region: sessionData.ipLocation?.region,
      city: sessionData.ipLocation?.city,
      latitude: sessionData.ipLocation?.latitude,
      longitude: sessionData.ipLocation?.longitude,
      entryUrl: sessionData.pageInfo.url,
      referrer: sessionData.pageInfo.referrer,
      utmSource: sessionData.pageInfo.utmSource,
      utmMedium: sessionData.pageInfo.utmMedium,
      utmCampaign: sessionData.pageInfo.utmCampaign,
      utmContent: sessionData.pageInfo.utmContent,
      utmTerm: sessionData.pageInfo.utmTerm,
      fbclid: sessionData.pageInfo.fbclid,
      gclid: sessionData.pageInfo.gclid
    };

    return { visitor, session };
  }

  setOnSessionEnd(callback: (sessionData: SessionData) => void): void {
    this.onSessionEndCallback = callback;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async createSessionData(): Promise<SessionData> {
    const visitorId = this.getOrCreateVisitorId();
    const sessionId = generateUUID();
    const fingerprint = generateFingerprint();
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();
    const now = new Date().toISOString();

    return {
      sessionId,
      visitorId,
      businessId: this.config.businessId,
      fingerprint,
      startedAt: now,
      lastActivityAt: now,
      
      deviceInfo,
      pageInfo: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        title: typeof document !== 'undefined' ? document.title : 'N/A',
        referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : 'N/A',
        pathname: typeof window !== 'undefined' ? window.location.pathname : '',
        search: typeof window !== 'undefined' ? window.location.search : '',
        hash: typeof window !== 'undefined' ? window.location.hash : '',
        ...utmParams
      },
      
      userBehavior: {
        sessionDuration: 0,
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
        engagementScore: 0,
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
      },
      
      events: [],
      isActive: true
    };
  }

  private getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return generateUUID();

    const storageKey = 'innova_visitor_id';
    let visitorId = localStorage.getItem(storageKey);
    
    if (!visitorId) {
      visitorId = generateUUID();
      localStorage.setItem(storageKey, visitorId);
      this.log('🆕 [SESSION MANAGER] Nuevo visitor ID creado:', visitorId);
    } else {
      this.log('🔄 [SESSION MANAGER] Visitor ID existente:', visitorId);
    }
    
    return visitorId;
  }

  private updateActivity(): void {
    if (!this.currentSession) return;

    const now = Date.now();
    this.currentSession.userBehavior.lastActivityAt = now;
    this.currentSession.userBehavior.timeSinceLastActivity = 0;
    this.currentSession.lastActivityAt = new Date().toISOString();
    
    // Reiniciar timer de inactividad
    this.resetInactivityTimer();
  }

  // ==================== TIMERS Y BUFFERING ====================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private startInactivityMonitoring(): void {
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.config.inactivityTimeout);
  }

  private startBatchProcessing(): void {
    this.batchFlushTimer = setInterval(() => {
      this.flushBatchBuffer();
    }, this.config.heartbeatInterval);
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.startInactivityMonitoring();
  }

  private stopAllTimers(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (this.batchFlushTimer) clearInterval(this.batchFlushTimer);
    if (this.immediateFlushTimer) clearTimeout(this.immediateFlushTimer);
  }

  private scheduleImmediateFlush(): void {
    if (this.immediateFlushTimer) return;
    
    this.immediateFlushTimer = setTimeout(async () => {
      await this.flushImmediateBuffer();
      this.immediateFlushTimer = null;
    }, 100); // 100ms delay para agrupar eventos inmediatos
  }

  private checkBatchFlush(): void {
    if (this.batchEventBuffer.length >= this.config.eventBufferSize) {
      this.flushBatchBuffer();
    }
  }

  // ==================== ENVÍO DE DATOS ====================

  private sendHeartbeat(): void {
    if (!this.currentSession) return;

    this.log('💓 [SESSION MANAGER] Generando heartbeat');
    this.addEvent({
      eventId: generateUUID(),
      sessionId: this.currentSession.sessionId,
      visitorId: this.currentSession.visitorId,
      businessId: this.config.businessId,
      category: 'system',
      eventType: 'heartbeat',
      eventName: 'heartbeat',
      priority: 'low', // Los heartbeats no son críticos
      eventData: {
        isActive: this.currentSession.userBehavior.isActive,
        scrollDepth: this.currentSession.userBehavior.maxScrollPercentage,
        timeOnPage: this.currentSession.userBehavior.timeOnPage,
      },
      timestamp: new Date().toISOString(),
      clientTimestamp: Date.now(),
      pageUrl: this.currentSession.pageInfo.url,
      pageTitle: this.currentSession.pageInfo.title,
      attempts: 0,
      sent: false,
    });
  }

  private async flushImmediateBuffer(): Promise<void> {
    if (this.immediateEventBuffer.length === 0 || !this.sendDataFunction || !this.currentSession) return;

    const eventsToProcess = [...this.immediateEventBuffer];
    this.immediateEventBuffer = [];

    try {
      const mappedEvents = eventsToProcess.map(this.mapEventToBackendSchema);
      await this.sendDataFunction({
        type: 'batch_events',
        sessionData: this.currentSession,
        events: mappedEvents
      });
      this.log(`⚡ [SESSION MANAGER] ${eventsToProcess.length} eventos inmediatos enviados`);
    } catch (error) {
      this.immediateEventBuffer.unshift(...eventsToProcess);
      this.logError('❌ [SESSION MANAGER] Error enviando eventos inmediatos:', error);
    }
  }

  private async flushBatchBuffer(): Promise<void> {
    if (this.batchEventBuffer.length === 0 || !this.sendDataFunction || !this.currentSession) return;

    const eventsToProcess = [...this.batchEventBuffer];
    this.batchEventBuffer = [];

    try {
      const mappedEvents = eventsToProcess.map(this.mapEventToBackendSchema);
      await this.sendDataFunction({
        type: 'batch_events',
        sessionData: this.currentSession,
        events: mappedEvents
      });
      this.log(`📦 [SESSION MANAGER] ${eventsToProcess.length} eventos batch enviados`);
    } catch (error) {
      this.batchEventBuffer.unshift(...eventsToProcess);
      this.logError('❌ [SESSION MANAGER] Error enviando eventos batch:', error);
    }
  }


  private async flushAllBuffers(): Promise<void> {
    await Promise.all([
      this.flushImmediateBuffer(),
      this.flushBatchBuffer()
    ]);
  }

  private handleInactivity(): void {
    if (!this.currentSession) return;

    this.sessionEndedByInactivity = true;
    this.currentSession.userBehavior.inactivityCount++;
    
    this.log('😴 [SESSION MANAGER] Inactividad detectada');
    this.endSession('inactivity');
  }

  // ==================== EVENT LISTENERS ====================

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Detección de cierre de ventana/pestaña
    window.addEventListener('beforeunload', () => {
      if (this.isSessionActive) {
        this.endSession('window_close');
      }
    });

    // Detección de cambio de visibilidad
    document.addEventListener('visibilitychange', () => {
      if (!this.currentSession) return;

      if (document.hidden) {
        this.currentSession.userBehavior.visibilityChanges++;
        this.addEvent({
          eventId: generateUUID(),
          sessionId: this.currentSession.sessionId,
          visitorId: this.currentSession.visitorId,
          businessId: this.config.businessId,
          category: 'system',
          eventType: 'visibility',
          eventName: 'tab_hidden',
          priority: 'low',
          eventData: { timestamp: Date.now() },
          timestamp: new Date().toISOString(),
          clientTimestamp: Date.now(),
          pageUrl: this.currentSession.pageInfo.url,
          pageTitle: this.currentSession.pageInfo.title,
          attempts: 0,
          sent: false,
        });
      } else {
        this.updateActivity();
        this.addEvent({
          eventId: generateUUID(),
          sessionId: this.currentSession.sessionId,
          visitorId: this.currentSession.visitorId,
          businessId: this.currentSession.businessId,
          category: 'system',
          eventType: 'visibility',
          eventName: 'tab_visible',
          priority: 'low',
          eventData: { timestamp: Date.now() },
          timestamp: new Date().toISOString(),
          clientTimestamp: Date.now(),
          pageUrl: this.currentSession.pageInfo.url,
          pageTitle: this.currentSession.pageInfo.title,
          attempts: 0,
          sent: false
        });
      }
    });
  }

  // ==================== UTILIDADES ====================

  reset(): void {
    this.stopAllTimers();
    this.currentSession = null;
    this.isSessionActive = false;
    this.sessionEndedByInactivity = false;
    this.immediateEventBuffer = [];
    this.batchEventBuffer = [];
  }

  private log(message: string, data?: any): void {
    if (!this.config.debug) return;
    
    const timestamp = new Date().toISOString();
    if (data !== undefined) {
      console.log(`[${timestamp}] ${message}`, data);
    } else {
      console.log(`[${timestamp}] ${message}`);
    }
  }

  private mapEventToBackendSchema(event: TrackingEvent): any {
    return {
      // Campos requeridos
      businessId: event.businessId,
      visitorId: event.visitorId,
      sessionId: event.sessionId,
      eventType: event.eventType,
      pageUrl: event.pageUrl,

      // Campos opcionales
      eventCategory: event.category,
      eventAction: event.eventName,
      pageTitle: event.pageTitle,
      timestamp: event.timestamp,
      eventData: event.eventData,

      // Simplificar deviceInfo y userBehavior si existen
      metadata: {
        clientTimestamp: event.clientTimestamp,
        priority: event.priority,
        deviceType: event.deviceInfo?.deviceType,
        browser: event.deviceInfo?.browser,
        os: event.deviceInfo?.operatingSystem,
        engagementScore: event.userBehavior?.engagementScore
      }
    };
  }

  private logError(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    if (error !== undefined) {
      console.error(`[${timestamp}] ${message}`, error);
    } else {
      console.error(`[${timestamp}] ${message}`);
    }
  }
}
