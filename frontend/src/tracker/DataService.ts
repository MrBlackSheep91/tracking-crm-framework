/**
 * 📡 DATA SERVICE CONSOLIDADO
 * Gestión inteligente de envío de datos con retry, fallback y optimización de red
 * Versión robusta que combina las mejoras del sistema Innova con la infraestructura CRM
 */

import { TrackerConfig, ApiResponse, HealthCheckResponse, DEFAULT_CONFIG } from '../types';

interface QueuedData {
  id: string;
  data: any;
  priority: 'immediate' | 'normal' | 'low';
  attempts: number;
  lastAttempt?: number;
  endpoint: string;
  type?: string;
}

export class DataService {
  private config: Required<TrackerConfig>;
  private isOnline = true;
  private failedQueue: QueuedData[] = [];
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Estadísticas
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    queuedItems: 0,
    lastSuccessfulRequest: null as string | null,
    lastFailedRequest: null as string | null
  };

  constructor(config: TrackerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupNetworkMonitoring();
    this.loadQueueFromStorage();
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Enviar datos al backend con retry automático
   */
  async sendData(data: any): Promise<boolean> {
    const queueItem: QueuedData = {
      id: this.generateId(),
      data,
      priority: this.determinePriority(data),
      attempts: 0,
      endpoint: this.getEndpoint(data.type || 'track')
    };

    return await this.processQueueItem(queueItem);
  }

  /**
   * Verificar estado de salud del backend
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.makeRequest('GET', `${this.config.baseUrl}/api/health`);
      
      if (response.ok) {
        const healthData = await response.json();
        return {
          healthy: true,
          timestamp: new Date().toISOString(),
          services: healthData.services || {
            database: true,
            tracking: true,
            api: true
          },
          metrics: healthData.metrics
        };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      return {
        healthy: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          database: false,
          tracking: false,
          api: false
        }
      };
    }
  }

  /**
   * Obtener métricas en tiempo real del backend
   */
  async getRealtimeMetrics(businessId?: string): Promise<any> {
    try {
      const url = `${this.config.baseUrl}${this.config.endpoints.metricsRealtime || '/api/metrics/realtime'}`;
      const fullUrl = businessId ? `${url}?businessId=${businessId}` : url;
      
      const response = await this.makeRequest('GET', fullUrl);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Metrics request failed: ${response.status}`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('🟡 Realtime metrics request failed:', error);
      }
      return null;
    }
  }

  /**
   * Obtener métricas del dashboard
   */
  async getDashboardMetrics(businessId?: string, period?: string): Promise<any> {
    try {
      const url = `${this.config.baseUrl}${this.config.endpoints.metricsDashboard || '/api/metrics/dashboard'}`;
      const params = new URLSearchParams();
      if (businessId) params.append('businessId', businessId);
      if (period) params.append('period', period);
      
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      const response = await this.makeRequest('GET', fullUrl);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Dashboard metrics request failed: ${response.status}`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('🟡 Dashboard metrics request failed:', error);
      }
      return null;
    }
  }

  /**
   * Obtener métricas generales
   */
  async getMetrics(businessId?: string, options: any = {}): Promise<any> {
    try {
      const url = `${this.config.baseUrl}${this.config.endpoints.metrics || '/api/metrics'}`;
      const params = new URLSearchParams();
      if (businessId) params.append('businessId', businessId);
      
      // Agregar parámetros adicionales
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined) {
          params.append(key, options[key].toString());
        }
      });
      
      const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
      const response = await this.makeRequest('GET', fullUrl);
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Metrics request failed: ${response.status}`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn('🟡 Metrics request failed:', error);
      }
      return null;
    }
  }

  /**
   * Enviar todos los datos pendientes
   */
  async flushAll(): Promise<void> {
    if (this.failedQueue.length === 0) {
      this.log('✅ [DATA SERVICE] No hay datos pendientes para enviar');
      return;
    }

    this.log(`📤 [DATA SERVICE] Enviando ${this.failedQueue.length} elementos pendientes`);
    
    const promises = this.failedQueue.map(item => this.processQueueItem(item));
    await Promise.allSettled(promises);
    
    // Limpiar elementos enviados exitosamente
    this.failedQueue = this.failedQueue.filter(item => item.attempts < this.config.maxRetries);
    this.saveQueueToStorage();
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats(): object {
    return {
      ...this.stats,
      queuedItems: this.failedQueue.length,
      isOnline: this.isOnline,
      config: {
        baseUrl: this.config.baseUrl,
        maxRetries: this.config.maxRetries,
        retryDelay: this.config.retryDelay
      }
    };
  }

  /**
   * Reiniciar el servicio
   */
  reset(): void {
    this.failedQueue = [];
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      queuedItems: 0,
      lastSuccessfulRequest: null,
      lastFailedRequest: null
    };
    this.clearStoredQueue();
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async processQueueItem(item: QueuedData): Promise<boolean> {
    try {
      // Actualizar intentos
      item.attempts = (item.attempts || 0) + 1;
      
      // Enviar datos
      const success = await this.sendToBackend(item);
      
      if (success) {
        this.log(`✅ [DATA SERVICE] Datos enviados exitosamente: ${item.type}`);
        return true;
      } else {
        throw new Error('Backend rejected data');
      }
    } catch (error) {
      this.logError(`❌ [DATA SERVICE] Error procesando item: ${item.type || 'unknown'}`, error);
      
      // Reintentar si no se ha alcanzado el límite
      if (item.attempts < this.config.maxRetries) {
        this.log(`🔄 [DATA SERVICE] Reintentando (${item.attempts}/${this.config.maxRetries}): ${item.type || 'unknown'}`);
        // Volver a encolar con delay exponencial
        setTimeout(() => {
          this.failedQueue.unshift(item);
          this.processQueueItem(item);
        }, Math.pow(2, item.attempts) * 1000);
        this.scheduleRetry();
      } else {
        this.logError(`💀 [DATA SERVICE] Máximo de reintentos alcanzado para: ${item.id}`);
        this.removeFromQueue(item.id);
      }

      return false;
    }
  }

  private async sendToBackend(item: QueuedData): Promise<boolean> {
    if (!this.isOnline) {
      throw new Error('Network offline');
    }

    const url = `${this.config.baseUrl}${item.endpoint}`;
    
    // El payload ya no se transforma. Se envía directamente.
    // La lógica de construcción del payload ahora reside en SessionManager.
    const requestData = item.data;

    // Debug logging para ver qué se está enviando
    if (this.config.debug) {
      console.log(`🔍 [DATA SERVICE] Enviando a ${url}:`, JSON.stringify(requestData, null, 2));
    }
    
    const response = await this.makeRequest('POST', url, {
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
        'X-Tracking-Client': 'innova-tracking-framework-v2.0',
        'X-Business-ID': this.config.businessId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [DATA SERVICE] Error ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success !== false; // Asumir éxito si no hay campo success
  }

  private async makeRequest(method: string, url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        ...options
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private determinePriority(data: any): 'immediate' | 'normal' | 'low' {
    if (data.type === 'immediate_events' || data.type === 'heartbeat') {
      return 'immediate';
    }
    if (data.type === 'session_end_events') {
      return 'low';
    }
    return 'normal';
  }

  private getEndpoint(dataType: string): string {
    switch (dataType) {
      // --- Nuevos Endpoints Simplificados ---
      case 'start_session':
        return this.config.endpoints.sessionStart || '/api/start-session';
      case 'track_event':
        return this.config.endpoints.trackEvent || '/api/track-event';
      case 'batch_events':
      case 'immediate_events':
      case 'session_end_events':
        return this.config.endpoints.batchEvents || '/api/batch-events';
      case 'heartbeat':
        return this.config.endpoints.heartbeat || '/api/heartbeat';
      case 'session_end':
        return this.config.endpoints.sessionEnd || '/api/end-session';

      // --- Endpoints de Métricas (sin cambios) ---
      case 'metrics':
        return this.config.endpoints.metrics || '/api/metrics';
      case 'metrics_realtime':
        return this.config.endpoints.metricsRealtime || '/api/metrics/realtime';
      case 'metrics_dashboard':
        return this.config.endpoints.metricsDashboard || '/api/metrics/dashboard';

      default:
        this.log(`⚠️ [DATA SERVICE] Tipo de dato desconocido: "${dataType}". Usando endpoint de batch por defecto.`);
        return this.config.endpoints.batchEvents || '/api/batch-events';
    }
  }

  private addToQueue(item: QueuedData): void {
    // Evitar duplicados
    const existingIndex = this.failedQueue.findIndex(q => q.id === item.id);
    if (existingIndex >= 0) {
      this.failedQueue[existingIndex] = item;
    } else {
      this.failedQueue.push(item);
    }
    
    // Ordenar por prioridad
    this.failedQueue.sort((a, b) => {
      const priorityOrder = { immediate: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    this.saveQueueToStorage();
  }

  private removeFromQueue(itemId: string): void {
    this.failedQueue = this.failedQueue.filter(item => item.id !== itemId);
    this.saveQueueToStorage();
  }

  private scheduleRetry(): void {
    if (this.retryTimer) return;

    const delay = this.config.retryDelay * Math.pow(2, Math.min(3, this.stats.failedRequests)); // Exponential backoff
    
    this.retryTimer = setTimeout(async () => {
      this.retryTimer = null;
      
      if (this.failedQueue.length > 0 && this.isOnline) {
        this.log(`🔄 [DATA SERVICE] Procesando ${this.failedQueue.length} elementos en cola`);
        
        // Procesar un elemento por vez para evitar sobrecarga
        const item = this.failedQueue[0];
        if (item && item.attempts < this.config.maxRetries) {
          await this.processQueueItem(item);
        }
        
        // Continuar si hay más elementos
        if (this.failedQueue.length > 0) {
          this.scheduleRetry();
        }
      }
    }, delay);
  }

  // ==================== PERSISTENCIA LOCAL ====================

  private saveQueueToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const queueData = {
        items: this.failedQueue,
        timestamp: Date.now()
      };
      localStorage.setItem('innova_tracking_queue', JSON.stringify(queueData));
    } catch (error) {
      this.logError('❌ [DATA SERVICE] Error guardando cola en localStorage:', error);
    }
  }

  private loadQueueFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem('innova_tracking_queue');
      if (stored) {
        const queueData = JSON.parse(stored);
        
        // Solo cargar si es reciente (menos de 24 horas)
        if (Date.now() - queueData.timestamp < 24 * 60 * 60 * 1000) {
          this.failedQueue = queueData.items || [];
          this.log(`📁 [DATA SERVICE] Cargados ${this.failedQueue.length} elementos desde localStorage`);
        } else {
          this.clearStoredQueue();
        }
      }
    } catch (error) {
      this.logError('❌ [DATA SERVICE] Error cargando cola desde localStorage:', error);
      this.clearStoredQueue();
    }
  }

  private clearStoredQueue(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('innova_tracking_queue');
    }
  }

  // ==================== MONITOREO DE RED ====================

  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Detectar estado online/offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.log('🌐 [DATA SERVICE] Conexión restaurada');
      
      // Reintentar envío automáticamente
      if (this.failedQueue.length > 0) {
        this.scheduleRetry();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.log('📴 [DATA SERVICE] Conexión perdida - datos se almacenarán localmente');
    });

    this.isOnline = navigator.onLine;
  }

  // ==================== UTILIDADES ====================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(): string {
    if (typeof window === 'undefined') return 'server-side-fingerprint';
    
    const canvas = 'mock-canvas-fingerprint';
    const screen = `${window.screen?.width || 1920}x${window.screen?.height || 1080}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const language = navigator.language || 'en';
    
    return btoa(`${canvas}-${screen}-${timezone}-${language}`).substring(0, 32);
  }

  private async getIpLocation(): Promise<any> {
    // Implementación simplificada - en producción usar servicio real
    return {
      ip: '127.0.0.1',
      country: 'Uruguay',
      region: 'Montevideo',
      city: 'Montevideo',
      lat: -34.9011,
      lon: -56.1645,
      timezone: 'America/Montevideo',
      isp: 'Local ISP'
    };
  }

  private getDeviceInfo(): any {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'Server-Side',
        deviceType: 'server',
        browserName: 'Unknown',
        osName: 'Unknown'
      };
    }

    const userAgent = navigator.userAgent;
    return {
      userAgent,
      screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      colorDepth: window.screen?.colorDepth || 24,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      language: navigator.language || 'en',
      platform: navigator.platform || 'Unknown',
      deviceType: this.detectDeviceType(userAgent),
      browserName: this.detectBrowser(userAgent),
      browserVersion: this.detectBrowserVersion(userAgent),
      osName: this.detectOS(userAgent),
      osVersion: this.detectOSVersion(userAgent)
    };
  }

  private getPageInfo(): any {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {
        url: 'server-side',
        title: 'Server Side',
        referrer: 'direct'
      };
    }

    return {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer || 'direct'
    };
  }

  private getUserBehavior(): any {
    const now = new Date().toISOString();
    return {
      sessionStartTime: now,
      referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
      initialUrl: typeof window !== 'undefined' ? window.location.href : 'server-side',
      initialTitle: typeof document !== 'undefined' ? document.title : 'Server Side'
    };
  }

  private detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private detectOSVersion(userAgent: string): string {
    if (userAgent.includes('Windows NT 10.0')) return '10';
    if (userAgent.includes('Windows NT 6.3')) return '8.1';
    if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X (\d+_\d+)/);
      return match ? match[1].replace('_', '.') : 'Unknown';
    }
    return 'Unknown';
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
