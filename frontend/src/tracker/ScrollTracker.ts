/**
 * 📜 SCROLL TRACKER CONSOLIDADO
 * Sistema avanzado de tracking de scroll con zonas de atención y métricas granulares
 * Versión optimizada que combina performance con precisión de datos
 */

import { TrackerConfig } from '../types';
import { DEFAULT_CONFIG } from '../config/defaults';

interface ScrollZone {
  zone: number;
  percentage: number;
  timeSpent: number;
  visits: number;
  lastVisit: number;
  firstVisit?: number;
}

interface ScrollStats {
  maxScrollPercentage: number;
  currentScrollPercentage: number;
  scrollDirection: 'up' | 'down' | 'none';
  scrollSpeed: number;
  totalScrollDistance: number;
  scrollEvents: number;
  attentionMap: { [zone: string]: ScrollZone };
  visibleZones: number[];
  averageTimePerZone: number;
  engagementScore: number;
}

export class ScrollTracker {
  private config: Required<TrackerConfig>;
  private isTracking = false;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;
  
  private stats: ScrollStats = {
    maxScrollPercentage: 0,
    currentScrollPercentage: 0,
    scrollDirection: 'none',
    scrollSpeed: 0,
    totalScrollDistance: 0,
    scrollEvents: 0,
    attentionMap: {},
    visibleZones: [],
    averageTimePerZone: 0,
    engagementScore: 0
  };

  // Para cálculo de velocidad y dirección
  private lastScrollTop = 0;
  private lastScrollTime = 0;
  private scrollSamples: number[] = [];
  
  // Para tracking de zonas
  private currentZone = 0;
  private zoneStartTime = 0;
  private totalZones = 0;

  // Callbacks
  private onScrollChangeCallback: ((stats: ScrollStats) => void) | null = null;
  private onZoneChangeCallback: ((zone: number, stats: ScrollZone) => void) | null = null;

  constructor(config: Required<TrackerConfig>) {
    this.config = config;
    this.initializeZones();
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Iniciar tracking de scroll
   */
  start(): void {
    if (this.isTracking) {
      this.log('⚠️ [SCROLL TRACKER] Ya está trackeando');
      return;
    }

    if (typeof window === 'undefined') {
      this.log('⚠️ [SCROLL TRACKER] No disponible en entorno sin DOM');
      return;
    }

    try {
      this.setupEventListeners();
      this.initializeCurrentPosition();
      this.isTracking = true;
      
      this.log('✅ [SCROLL TRACKER] Tracking iniciado');
    } catch (error) {
      this.logError('❌ [SCROLL TRACKER] Error iniciando tracking:', error);
    }
  }

  /**
   * Detener tracking de scroll
   */
  stop(): void {
    if (!this.isTracking) {
      this.log('⚠️ [SCROLL TRACKER] No está trackeando');
      return;
    }

    try {
      this.removeEventListeners();
      this.finalizeCurrentZone();
      this.isTracking = false;
      
      this.log('🛑 [SCROLL TRACKER] Tracking detenido');
    } catch (error) {
      this.logError('❌ [SCROLL TRACKER] Error deteniendo tracking:', error);
    }
  }

  /**
   * Obtener estadísticas actuales
   */
  getStats(): ScrollStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Obtener porcentaje de scroll actual
   */
  getCurrentScrollPercentage(): number {
    return this.stats.currentScrollPercentage;
  }

  /**
   * Obtener porcentaje máximo alcanzado
   */
  getMaxScrollPercentage(): number {
    return this.stats.maxScrollPercentage;
  }

  /**
   * Obtener mapa de atención por zonas
   */
  getAttentionMap(): { [zone: string]: ScrollZone } {
    return { ...this.stats.attentionMap };
  }

  /**
   * Obtener zonas actualmente visibles
   */
  getVisibleZones(): number[] {
    return [...this.stats.visibleZones];
  }

  /**
   * Configurar callback para cambios de scroll
   */
  onScrollChange(callback: (stats: ScrollStats) => void): void {
    this.onScrollChangeCallback = callback;
  }

  /**
   * Configurar callback para cambios de zona
   */
  onZoneChange(callback: (zone: number, stats: ScrollZone) => void): void {
    this.onZoneChangeCallback = callback;
  }

  /**
   * Reiniciar estadísticas
   */
  reset(): void {
    this.stop();
    this.stats = {
      maxScrollPercentage: 0,
      currentScrollPercentage: 0,
      scrollDirection: 'none',
      scrollSpeed: 0,
      totalScrollDistance: 0,
      scrollEvents: 0,
      attentionMap: {},
      visibleZones: [],
      averageTimePerZone: 0,
      engagementScore: 0
    };
    this.lastScrollTop = 0;
    this.lastScrollTime = 0;
    this.scrollSamples = [];
    this.currentZone = 0;
    this.zoneStartTime = 0;
    this.initializeZones();
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private initializeZones(): void {
    this.totalZones = Math.ceil(100 / this.config.scrollZoneSize);
    
    // Crear zonas vacías
    for (let i = 0; i < this.totalZones; i++) {
      const zoneKey = `zone_${i}`;
      this.stats.attentionMap[zoneKey] = {
        zone: i,
        percentage: i * this.config.scrollZoneSize,
        timeSpent: 0,
        visits: 0,
        lastVisit: 0
      };
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
  }

  private removeEventListeners(): void {
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private handleScroll(): void {
    if (this.throttleTimer) return;

    this.throttleTimer = setTimeout(() => {
      this.processScrollEvent();
      this.throttleTimer = null;
    }, this.config.scrollUpdateInterval);
  }

  private handleResize(): void {
    // Recalcular posiciones después de resize
    setTimeout(() => {
      this.initializeCurrentPosition();
    }, 100);
  }

  private processScrollEvent(): void {
    const now = Date.now();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    
    // Calcular porcentaje actual
    const maxScrollTop = documentHeight - windowHeight;
    const currentPercentage = maxScrollTop > 0 ? Math.round((scrollTop / maxScrollTop) * 100) : 0;
    
    // Actualizar estadísticas básicas
    this.stats.currentScrollPercentage = Math.max(0, Math.min(100, currentPercentage));
    this.stats.maxScrollPercentage = Math.max(this.stats.maxScrollPercentage, this.stats.currentScrollPercentage);
    this.stats.scrollEvents++;
    
    // Calcular dirección y velocidad
    this.calculateScrollMetrics(scrollTop, now);
    
    // Procesar cambio de zona
    this.processZoneChange();
    
    // Actualizar zonas visibles
    this.updateVisibleZones();
    
    // Actualizar estadísticas generales
    this.updateStats();
    
    // Notificar cambios
    this.notifyScrollChange();
    
    // Actualizar valores anteriores
    this.lastScrollTop = scrollTop;
    this.lastScrollTime = now;
  }

  private calculateScrollMetrics(scrollTop: number, timestamp: number): void {
    if (this.lastScrollTime === 0) {
      this.lastScrollTime = timestamp;
      this.lastScrollTop = scrollTop;
      return;
    }

    const timeDiff = timestamp - this.lastScrollTime;
    const scrollDiff = scrollTop - this.lastScrollTop;
    
    if (timeDiff > 0) {
      // Calcular velocidad (pixels por segundo)
      const speed = Math.abs(scrollDiff) / (timeDiff / 1000);
      this.scrollSamples.push(speed);
      
      // Mantener solo las últimas 5 muestras para promedio móvil
      if (this.scrollSamples.length > 5) {
        this.scrollSamples.shift();
      }
      
      this.stats.scrollSpeed = this.scrollSamples.reduce((a, b) => a + b, 0) / this.scrollSamples.length;
      
      // Actualizar dirección
      if (Math.abs(scrollDiff) > 5) { // Umbral mínimo para evitar jitter
        this.stats.scrollDirection = scrollDiff > 0 ? 'down' : 'up';
      }
      
      // Acumular distancia total
      this.stats.totalScrollDistance += Math.abs(scrollDiff);
    }
  }

  private processZoneChange(): void {
    const newZone = Math.floor(this.stats.currentScrollPercentage / this.config.scrollZoneSize);
    
    if (newZone !== this.currentZone) {
      // Finalizar zona anterior
      this.finalizeCurrentZone();
      
      // Iniciar nueva zona
      this.startNewZone(newZone);
    }
  }

  private startNewZone(zoneNumber: number): void {
    this.currentZone = zoneNumber;
    this.zoneStartTime = Date.now();
    
    const zoneKey = `zone_${zoneNumber}`;
    if (this.stats.attentionMap[zoneKey]) {
      this.stats.attentionMap[zoneKey].visits++;
      this.stats.attentionMap[zoneKey].lastVisit = this.zoneStartTime;
      
      if (!this.stats.attentionMap[zoneKey].firstVisit) {
        this.stats.attentionMap[zoneKey].firstVisit = this.zoneStartTime;
      }
      
      this.log(`📍 [SCROLL TRACKER] Entrando en zona ${zoneNumber} (${this.stats.attentionMap[zoneKey].percentage}%)`);
      
      // Notificar cambio de zona
      if (this.onZoneChangeCallback) {
        this.onZoneChangeCallback(zoneNumber, this.stats.attentionMap[zoneKey]);
      }
    }
  }

  private finalizeCurrentZone(): void {
    if (this.zoneStartTime === 0) return;
    
    const timeSpent = Date.now() - this.zoneStartTime;
    const zoneKey = `zone_${this.currentZone}`;
    
    if (this.stats.attentionMap[zoneKey]) {
      this.stats.attentionMap[zoneKey].timeSpent += timeSpent;
      this.log(`⏱️ [SCROLL TRACKER] Zona ${this.currentZone} - tiempo: ${timeSpent}ms`);
    }
    
    this.zoneStartTime = 0;
  }

  private updateVisibleZones(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const topPercentage = (scrollTop / documentHeight) * 100;
    const bottomPercentage = ((scrollTop + windowHeight) / documentHeight) * 100;
    
    const visibleZones: number[] = [];
    
    for (let i = 0; i < this.totalZones; i++) {
      const zoneStart = i * this.config.scrollZoneSize;
      const zoneEnd = (i + 1) * this.config.scrollZoneSize;
      
      // Verificar si la zona está visible (parcial o completamente)
      if (zoneStart < bottomPercentage && zoneEnd > topPercentage) {
        visibleZones.push(i);
      }
    }
    
    this.stats.visibleZones = visibleZones;
  }

  private updateStats(): void {
    // Calcular tiempo promedio por zona
    const zonesWithTime = Object.values(this.stats.attentionMap).filter(zone => zone.timeSpent > 0);
    this.stats.averageTimePerZone = zonesWithTime.length > 0 
      ? zonesWithTime.reduce((sum, zone) => sum + zone.timeSpent, 0) / zonesWithTime.length
      : 0;
    
    // Calcular engagement score basado en:
    // - Profundidad de scroll (40%)
    // - Tiempo en zonas (30%)
    // - Variedad de zonas visitadas (30%)
    const depthScore = this.stats.maxScrollPercentage;
    const timeScore = Math.min(100, this.stats.averageTimePerZone / 1000 * 10); // Normalizar a 0-100
    const varietyScore = (zonesWithTime.length / this.totalZones) * 100;
    
    this.stats.engagementScore = Math.round(
      depthScore * 0.4 + timeScore * 0.3 + varietyScore * 0.3
    );
  }

  private initializeCurrentPosition(): void {
    if (typeof window === 'undefined') return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    
    const maxScrollTop = documentHeight - windowHeight;
    const currentPercentage = maxScrollTop > 0 ? Math.round((scrollTop / maxScrollTop) * 100) : 0;
    
    this.stats.currentScrollPercentage = Math.max(0, Math.min(100, currentPercentage));
    this.stats.maxScrollPercentage = this.stats.currentScrollPercentage;
    
    // Inicializar zona actual
    const initialZone = Math.floor(this.stats.currentScrollPercentage / this.config.scrollZoneSize);
    this.startNewZone(initialZone);
    
    // Actualizar zonas visibles
    this.updateVisibleZones();
  }

  private notifyScrollChange(): void {
    if (this.onScrollChangeCallback) {
      this.onScrollChangeCallback(this.getStats());
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
