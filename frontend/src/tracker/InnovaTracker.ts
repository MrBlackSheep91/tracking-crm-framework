/**
 * 🚀 INNOVA TRACKER - CLASE PRINCIPAL CONSOLIDADA
 * Sistema unificado que combina la robustez del backend CRM 
 * con las funcionalidades avanzadas del frontend Innova
 */

import { SessionManager } from './SessionManager';
import { DataService } from './DataService';
import { ActivityMonitor } from './ActivityMonitor';
import { ScrollTracker } from './ScrollTracker';
import { generateUUID } from '../utils/uuid';
import { 
  TrackerConfig, 
  SessionData, 
  TrackingEvent, 
  DEFAULT_CONFIG,
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  ApiResponse,
  HealthCheckResponse
} from '../types';

export class InnovaTracker {
  private config: Required<TrackerConfig>;
  private sessionManager: SessionManager;
  private dataService: DataService;
  private activityMonitor: ActivityMonitor;
  private scrollTracker: ScrollTracker;
  
  private isInitialized = false;
  private isTracking = false;
  private currentUrl: string = '';
  
  constructor(config: TrackerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Inicializar módulos
    this.sessionManager = new SessionManager(this.config);
    this.dataService = new DataService(this.config);
    this.activityMonitor = new ActivityMonitor(this.config);
    this.scrollTracker = new ScrollTracker(this.config);
    
    this.log('🚀 [INNOVA TRACKER] Inicializado con configuración:', this.config);
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Inicializar el tracker (sin empezar a trackear automáticamente)
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      this.log('⚠️ [INNOVA TRACKER] Ya está inicializado');
      return;
    }

    try {
      // Verificar conectividad con el backend
      const healthCheck = await this.healthCheck();
      if (!healthCheck.healthy) {
        this.logError('❌ [INNOVA TRACKER] Backend no disponible', healthCheck);
      }

      // Configurar callbacks entre módulos
      this.setupModuleCallbacks();

      this.isInitialized = true;
      this.log('✅ [INNOVA TRACKER] Inicialización completada');

      // Auto-iniciar si está configurado
      if (this.config.autoStart) {
        await this.startTracking();
      }

    } catch (error) {
      this.logError('❌ [INNOVA TRACKER] Error en inicialización:', error);
      this.config.onError?.(error as Error, 'initialization');
      throw error;
    }
  }

  /**
   * Comenzar el tracking de la sesión
   */
  async startTracking(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.isTracking) {
      this.log('⚠️ [INNOVA TRACKER] Ya está trackeando');
      return;
    }

    try {
      // Iniciar sesión
      await this.sessionManager.startSession();
      
      // Iniciar monitoreo de actividad
      if (this.config.enableActivityMonitoring) {
        this.activityMonitor.start();
      }
      
      // Iniciar tracking de scroll
      if (this.config.enableScrollTracking) {
        this.scrollTracker.start();
      }

      this.isTracking = true;
      this.log('✅ [INNOVA TRACKER] Tracking iniciado');

      // Trackear evento de inicio de sesión
      this.track('system', 'session_start', {
        timestamp: Date.now(),
        config: {
          enableScrollTracking: this.config.enableScrollTracking,
          enableActivityMonitoring: this.config.enableActivityMonitoring
        }
      });

      // Callback de inicio de sesión
      const sessionData = this.sessionManager.getCurrentSession();
      if (sessionData) {
        this.config.onSessionStart?.(sessionData);
      }

    } catch (error) {
      this.logError('❌ [INNOVA TRACKER] Error iniciando tracking:', error);
      this.config.onError?.(error as Error, 'start_tracking');
      throw error;
    }
  }

  /**
   * Detener el tracking de la sesión
   */
  async stopTracking(reason: string = 'manual'): Promise<void> {
    if (!this.isTracking) {
      this.log('⚠️ [INNOVA TRACKER] No está trackeando');
      return;
    }

    try {
      // Trackear evento de fin de sesión
      this.track('system', 'session_end', {
        reason,
        timestamp: Date.now()
      });

      // Detener módulos
      this.activityMonitor.stop();
      this.scrollTracker.stop();
      
      // Finalizar sesión y enviar datos pendientes
      await this.sessionManager.endSession(reason as any);
      await this.dataService.flushAll();

      this.isTracking = false;
      this.log(`✅ [INNOVA TRACKER] Tracking detenido. Razón: ${reason}`);

      // Callback de fin de sesión
      const sessionData = this.sessionManager.getCurrentSession();
      if (sessionData) {
        this.config.onSessionEnd?.(sessionData);
      }

    } catch (error) {
      this.logError('❌ [INNOVA TRACKER] Error deteniendo tracking:', error);
      this.config.onError?.(error as Error, 'stop_tracking');
    }
  }

  // ==================== MÉTODOS DE TRACKING ====================

  /**
   * Trackear evento personalizado
   */
  track(eventType: string, eventName: string, eventData: Record<string, any> = {}): void {
    if (!this.isTracking) {
      this.log('⚠️ [INNOVA TRACKER] No está trackeando - evento ignorado:', eventName);
      return;
    }

    try {
      const event: TrackingEvent = {
        eventId: generateUUID(),
        sessionId: this.sessionManager.getSessionId() || '',
        visitorId: this.sessionManager.getVisitorId() || '',
        businessId: this.config.businessId,
        
        category: eventType as any,
        eventType,
        eventName,
        priority: 'normal',
        
        eventData,
        timestamp: new Date().toISOString(),
        clientTimestamp: Date.now(),
        
        pageUrl: this.currentUrl || (typeof window !== 'undefined' ? window.location.href : ''),
        pageTitle: typeof document !== 'undefined' ? document.title : '',
        
        attempts: 0,
        sent: false
      };

      // Enviar evento a través del session manager
      this.sessionManager.addEvent(event);
      
      // Callback de evento
      this.config.onEventTrack?.(event);
      
      this.log('📊 [INNOVA TRACKER] Evento trackeado:', { eventType, eventName, eventData });

    } catch (error) {
      this.logError('❌ [INNOVA TRACKER] Error trackeando evento:', error);
      this.config.onError?.(error as Error, 'track_event');
    }
  }

  /**
   * Trackear vista de página
   */
  setCurrentUrl(url: string): void {
    this.currentUrl = url;
    if (this.sessionManager) {
      this.sessionManager.updateCurrentUrl(url);
    }
    this.log(`[INNOVA TRACKER] URL de página actualizada a: ${url}`);
  }

  /**
   * Trackear vista de página
   */
  trackPageView(page: string, data: Record<string, any> = {}): void {
    const newUrl = data.url || this.currentUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (newUrl) {
        this.setCurrentUrl(newUrl);
    }
    this.track(EVENT_CATEGORIES.PAGE_VIEW, 'page_view', {
      page,
      url: typeof window !== 'undefined' ? window.location.href : '',
      title: typeof document !== 'undefined' ? document.title : '',
      timestamp: Date.now(),
      ...data
    });
  }

  /**
   * Trackear clic en botón
   */
  trackButtonClick(buttonId: string, buttonText?: string, data: Record<string, any> = {}): void {
    this.track(EVENT_CATEGORIES.USER_INTERACTION, 'button_click', {
      buttonId,
      buttonText,
      timestamp: Date.now(),
      ...data
    });
  }

  /**
   * Trackear interacción con formulario
   */
  trackFormInteraction(formId: string, action: string, data: Record<string, any> = {}): void {
    this.track(EVENT_CATEGORIES.FORM_INTERACTION, 'form_interaction', {
      formId,
      action, // 'focus', 'blur', 'change', 'submit'
      timestamp: Date.now(),
      ...data
    });
  }

  /**
   * Trackear clic en CTA
   */
  trackCTAClick(ctaName: string, data: Record<string, any> = {}): void {
    this.track(EVENT_CATEGORIES.CONVERSION, 'cta_click', {
      ctaName,
      timestamp: Date.now(),
      priority: EVENT_PRIORITIES.HIGH,
      ...data
    });
  }

  /**
   * Trackear conversión/lead
   */
  trackConversion(conversionType: string, data: Record<string, any> = {}): void {
    this.track(EVENT_CATEGORIES.CONVERSION, 'conversion', {
      conversionType,
      timestamp: Date.now(),
      priority: EVENT_PRIORITIES.IMMEDIATE,
      ...data
    });
  }

  /**
   * Trackear evento personalizado
   */
  trackCustomEvent(eventName: string, data: Record<string, any> = {}): void {
    this.track(EVENT_CATEGORIES.CUSTOM, eventName, {
      timestamp: Date.now(),
      ...data
    });
  }

  // ==================== MÉTODOS DE INFORMACIÓN ====================

  /**
   * Obtener el ID de la sesión actual
   */
  getSessionId(): string | null {
    return this.sessionManager.getSessionId();
  }

  /**
   * Obtener información de la sesión actual
   */
  getSessionInfo(): SessionData | null {
    return this.sessionManager.getCurrentSession();
  }

  /**
   * Obtener estadísticas de la cola y estado del servicio
   */
  getStats(): any {
    return {
      ...this.dataService.getStats(),
      isTracking: this.isTracking,
      isInitialized: this.isInitialized,
      session: this.sessionManager.getCurrentSession(),
      activity: this.activityMonitor.getStats(),
      scroll: this.scrollTracker.getStats()
    };
  }

  /**
   * Obtener métricas en tiempo real del backend
   */
  async getRealtimeMetrics(): Promise<any> {
    return await this.dataService.getRealtimeMetrics(this.config.businessId);
  }

  /**
   * Obtener métricas del dashboard
   */
  async getDashboardMetrics(period?: string): Promise<any> {
    return await this.dataService.getDashboardMetrics(this.config.businessId, period);
  }

  /**
   * Obtener métricas generales con opciones
   */
  async getMetrics(options: any = {}): Promise<any> {
    return await this.dataService.getMetrics(this.config.businessId, options);
  }

  /**
   * Verificar estado de salud del sistema
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.dataService.healthCheck();
      return response;
    } catch (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        services: {
          database: false,
          tracking: false,
          api: false
        }
      };
    }
  }

  // ==================== GESTIÓN DE CALLBACKS ====================

  /**
   * Configurar callback para inicio de sesión
   */
  onSessionStart(callback: (sessionData: SessionData) => void): void {
    this.config.onSessionStart = callback;
  }

  /**
   * Configurar callback para fin de sesión
   */
  onSessionEnd(callback: (sessionData: SessionData) => void): void {
    this.config.onSessionEnd = callback;
  }

  /**
   * Configurar callback para eventos
   */
  onEventTrack(callback: (event: TrackingEvent) => void): void {
    this.config.onEventTrack = callback;
  }

  /**
   * Configurar callback para errores
   */
  onError(callback: (error: Error, context?: string) => void): void {
    this.config.onError = callback;
  }

  // ==================== MÉTODOS DE CONTROL ====================

  /**
   * Enviar todos los datos pendientes inmediatamente
   */
  async flush(): Promise<void> {
    try {
      await this.dataService.flushAll();
      this.log('✅ [INNOVA TRACKER] Datos enviados');
    } catch (error) {
      this.logError('❌ [INNOVA TRACKER] Error enviando datos:', error);
      this.config.onError?.(error as Error, 'flush');
      throw error;
    }
  }

  /**
   * Limpiar todos los datos y reiniciar
   */
  async reset(): Promise<void> {
    try {
      if (this.isTracking) {
        await this.stopTracking('reset');
      }
      
      this.sessionManager.reset();
      this.dataService.reset();
      this.activityMonitor.reset();
      this.scrollTracker.reset();
      
      this.isInitialized = false;
      this.isTracking = false;
      
      this.log('✅ [INNOVA TRACKER] Reset completado');
    } catch (error) {
      this.logError('❌ [INNOVA TRACKER] Error en reset:', error);
      this.config.onError?.(error as Error, 'reset');
      throw error;
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private setupModuleCallbacks(): void {
    // Configurar envío de datos del session manager
    this.sessionManager.setSendDataFunction(
      (data: any) => this.dataService.sendData(data)
    );
    
    // Configurar callbacks de actividad
    this.activityMonitor.onActivityChange((stats) => {
      this.sessionManager.updateUserBehavior({ lastActivityAt: Date.now() });
    });
    
    // Configurar callbacks de scroll
    this.scrollTracker.onScrollChange((stats) => {
      this.sessionManager.updateUserBehavior({
        maxScrollPercentage: stats.maxScrollPercentage,
        currentScrollPercentage: stats.currentScrollPercentage,
        attentionMap: stats.attentionMap
      });
    });
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

  private logError(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    if (error !== undefined) {
      console.error(`[${timestamp}] ${message}`, error);
    } else {
      console.error(`[${timestamp}] ${message}`);
    }
  }
}
