/**
 * 👁️ ACTIVITY MONITOR CONSOLIDADO
 * Monitoreo avanzado de actividad del usuario con detección de patrones
 * Sistema robusto para detectar engagement y comportamiento genuino
 */

import { TrackerConfig, DEFAULT_CONFIG } from '../types';

interface ActivityStats {
  isActive: boolean;
  lastActivityAt: number;
  timeSinceLastActivity: number;
  totalActiveTime: number;
  totalInactiveTime: number;
  inactivityCount: number;
  activityEvents: {
    clicks: number;
    keystrokes: number;
    mouseMoves: number;
    scrolls: number;
    focus: number;
    blur: number;
  };
  engagementScore: number;
  interactionScore: number;
}

type ActivityType = 'click' | 'keydown' | 'mousemove' | 'scroll' | 'focus' | 'blur' | 'touchstart' | 'touchmove';

export class ActivityMonitor {
  private config: Required<TrackerConfig>;
  private isMonitoring = false;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private activityUpdateTimer: ReturnType<typeof setTimeout> | null = null;
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  
  private stats: ActivityStats = {
    isActive: true,
    lastActivityAt: Date.now(),
    timeSinceLastActivity: 0,
    totalActiveTime: 0,
    totalInactiveTime: 0,
    inactivityCount: 0,
    activityEvents: {
      clicks: 0,
      keystrokes: 0,
      mouseMoves: 0,
      scrolls: 0,
      focus: 0,
      blur: 0
    },
    engagementScore: 0,
    interactionScore: 0
  };

  // Tracking de mousemove con throttling
  private lastMouseMove = 0;
  private mouseMoveThrottle = 1000; // 1 segundo

  // Callbacks
  private onActivityChangeCallback: ((stats: ActivityStats) => void) | null = null;
  private onInactivityCallback: (() => void) | null = null;

  constructor(config: TrackerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Iniciar monitoreo de actividad
   */
  start(): void {
    if (this.isMonitoring) {
      this.log('⚠️ [ACTIVITY MONITOR] Ya está monitoreando');
      return;
    }

    if (typeof window === 'undefined') {
      this.log('⚠️ [ACTIVITY MONITOR] No disponible en entorno sin DOM');
      return;
    }

    try {
      this.setupEventListeners();
      this.startTimers();
      this.isMonitoring = true;
      this.stats.isActive = true;
      this.stats.lastActivityAt = Date.now();
      
      this.log('✅ [ACTIVITY MONITOR] Monitoreo iniciado');
    } catch (error) {
      this.logError('❌ [ACTIVITY MONITOR] Error iniciando monitoreo:', error);
    }
  }

  /**
   * Detener monitoreo de actividad
   */
  stop(): void {
    if (!this.isMonitoring) {
      this.log('⚠️ [ACTIVITY MONITOR] No está monitoreando');
      return;
    }

    try {
      this.removeEventListeners();
      this.stopTimers();
      this.isMonitoring = false;
      
      this.log('🛑 [ACTIVITY MONITOR] Monitoreo detenido');
    } catch (error) {
      this.logError('❌ [ACTIVITY MONITOR] Error deteniendo monitoreo:', error);
    }
  }

  /**
   * Obtener estadísticas actuales
   */
  getStats(): ActivityStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Verificar si el usuario está activo
   */
  isUserActive(): boolean {
    return this.stats.isActive && this.stats.timeSinceLastActivity < this.config.inactivityTimeout;
  }

  /**
   * Obtener tiempo desde la última actividad
   */
  getTimeSinceLastActivity(): number {
    return Date.now() - this.stats.lastActivityAt;
  }

  /**
   * Configurar callback para cambios de actividad
   */
  onActivityChange(callback: (stats: ActivityStats) => void): void {
    this.onActivityChangeCallback = callback;
  }

  /**
   * Configurar callback para inactividad
   */
  onInactivity(callback: () => void): void {
    this.onInactivityCallback = callback;
  }

  /**
   * Reiniciar estadísticas
   */
  reset(): void {
    this.stop();
    this.stats = {
      isActive: true,
      lastActivityAt: Date.now(),
      timeSinceLastActivity: 0,
      totalActiveTime: 0,
      totalInactiveTime: 0,
      inactivityCount: 0,
      activityEvents: {
        clicks: 0,
        keystrokes: 0,
        mouseMoves: 0,
        scrolls: 0,
        focus: 0,
        blur: 0
      },
      engagementScore: 0,
      interactionScore: 0
    };
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private setupEventListeners(): void {
    const activities: ActivityType[] = ['click', 'keydown', 'mousemove', 'scroll', 'focus', 'blur'];
    
    activities.forEach(activity => {
      document.addEventListener(activity, this.handleActivity.bind(this, activity), { passive: true });
    });

    // Eventos táctiles para dispositivos móviles
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', this.handleActivity.bind(this, 'touchstart'), { passive: true });
      document.addEventListener('touchmove', this.handleActivity.bind(this, 'touchmove'), { passive: true });
    }

    // Eventos específicos de ventana
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
  }

  private removeEventListeners(): void {
    const activities: ActivityType[] = ['click', 'keydown', 'mousemove', 'scroll', 'focus', 'blur'];
    
    activities.forEach(activity => {
      document.removeEventListener(activity, this.handleActivity.bind(this, activity));
    });

    if ('ontouchstart' in window) {
      document.removeEventListener('touchstart', this.handleActivity.bind(this, 'touchstart'));
      document.removeEventListener('touchmove', this.handleActivity.bind(this, 'touchmove'));
    }

    window.removeEventListener('focus', this.handleWindowFocus.bind(this));
    window.removeEventListener('blur', this.handleWindowBlur.bind(this));
  }

  private handleActivity(activityType: ActivityType, event?: Event): void {
    const now = Date.now();

    // Throttling para mousemove
    if (activityType === 'mousemove') {
      if (now - this.lastMouseMove < this.mouseMoveThrottle) {
        return;
      }
      this.lastMouseMove = now;
    }

    // Actualizar estadísticas
    this.recordActivity(activityType, now);
    
    // Resetear timer de inactividad
    this.resetInactivityTimer();
    
    // Notificar cambio si pasó de inactivo a activo
    if (!this.stats.isActive) {
      this.stats.isActive = true;
      this.log('✅ [ACTIVITY MONITOR] Usuario activo nuevamente');
      this.notifyActivityChange();
    }
  }

  private recordActivity(activityType: ActivityType, timestamp: number): void {
    this.stats.lastActivityAt = timestamp;
    this.stats.timeSinceLastActivity = 0;

    // Contar eventos específicos
    switch (activityType) {
      case 'click':
      case 'touchstart':
        this.stats.activityEvents.clicks++;
        break;
      case 'keydown':
        this.stats.activityEvents.keystrokes++;
        break;
      case 'mousemove':
      case 'touchmove':
        this.stats.activityEvents.mouseMoves++;
        break;
      case 'scroll':
        this.stats.activityEvents.scrolls++;
        break;
      case 'focus':
        this.stats.activityEvents.focus++;
        break;
      case 'blur':
        this.stats.activityEvents.blur++;
        break;
    }

    this.updateEngagementScores();
  }

  private handleWindowFocus(): void {
    this.handleActivity('focus');
    this.log('👁️ [ACTIVITY MONITOR] Ventana enfocada');
  }

  private handleWindowBlur(): void {
    this.handleActivity('blur');
    this.log('👁️ [ACTIVITY MONITOR] Ventana desenfocada');
  }

  private startTimers(): void {
    // Timer de inactividad
    this.resetInactivityTimer();
    
    // Timer de actualización periódica
    this.updateTimer = setInterval(() => {
      this.updateStats();
      this.notifyActivityChange();
    }, this.config.activityUpdateInterval);
  }

  private stopTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.config.inactivityTimeout);
  }

  private handleInactivity(): void {
    if (this.stats.isActive) {
      this.stats.isActive = false;
      this.stats.inactivityCount++;
      this.log('😴 [ACTIVITY MONITOR] Usuario inactivo');
      
      this.notifyActivityChange();
      
      if (this.onInactivityCallback) {
        this.onInactivityCallback();
      }
    }
  }

  private updateStats(): void {
    const now = Date.now();
    this.stats.timeSinceLastActivity = now - this.stats.lastActivityAt;
    
    // Calcular tiempos acumulados
    if (this.stats.isActive) {
      this.stats.totalActiveTime += this.config.activityUpdateInterval;
    } else {
      this.stats.totalInactiveTime += this.config.activityUpdateInterval;
    }

    this.updateEngagementScores();
  }

  private updateEngagementScores(): void {
    const totalTime = this.stats.totalActiveTime + this.stats.totalInactiveTime;
    
    if (totalTime === 0) {
      this.stats.engagementScore = 0;
      this.stats.interactionScore = 0;
      return;
    }

    // Engagement Score: Basado en tiempo activo vs total
    const activeRatio = this.stats.totalActiveTime / totalTime;
    this.stats.engagementScore = Math.round(activeRatio * 100);

    // Interaction Score: Basado en variedad y frecuencia de interacciones
    const totalInteractions = Object.values(this.stats.activityEvents).reduce((sum, count) => sum + count, 0);
    const uniqueInteractionTypes = Object.values(this.stats.activityEvents).filter(count => count > 0).length;
    
    const interactionDensity = totalInteractions / (totalTime / 60000); // Por minuto
    const varietyBonus = uniqueInteractionTypes / 6; // 6 tipos diferentes
    
    this.stats.interactionScore = Math.round(Math.min(100, (interactionDensity * 20 + varietyBonus * 50)));
  }

  private notifyActivityChange(): void {
    if (this.onActivityChangeCallback) {
      this.onActivityChangeCallback(this.getStats());
    }
  }

  // ==================== UTILIDADES ====================

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
