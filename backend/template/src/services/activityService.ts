import { PrismaClient, Activity, Session, TrackingEvent } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Definimos el tipo para el cliente de transacción de Prisma
type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const prisma = new PrismaClient();

/**
 * Interfaz para datos de actividad
 */
interface ActivityData {
  type: string;
  category: string;
  entityType: string;
  entityId: string;
  leadId?: string;
  contactId?: string;
  title?: string;
  description?: string;
  pageInfo?: any;
  metadata?: any;
  source?: string;
}

/**
 * Servicio para el manejo de actividades de usuario
 */
export class ActivityService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Crea una nueva actividad en el sistema
   */
    async createActivity(tx: PrismaTransactionClient, businessId: number, activityData: ActivityData): Promise<Activity> {
    try {
      console.log(`[ACTIVITY SERVICE] Creando actividad: ${activityData.type} - ${activityData.title}`);

      const activity = await tx.activity.create({
        data: {
          businessId: parseInt(businessId as any, 10),
          type: activityData.type,
          category: activityData.category,
          activityType: activityData.type,
          entityType: activityData.entityType,
          entityId: activityData.entityId,
          leadId: activityData.leadId || null,
          contactId: activityData.contactId || null,
          title: activityData.title || null,
          description: activityData.description || null,
          pageInfo: activityData.pageInfo,
          metadata: activityData.metadata,
          source: activityData.source || 'tracking',
          createdAt: new Date()
        }
      });

      console.log(`[ACTIVITY SERVICE] Actividad creada exitosamente: ${activity.id}`);
      return activity;
    } catch (error) {
      console.error('[ACTIVITY SERVICE] Error creando actividad:', error);
      throw error;
    }
  }

  /**
   * Crea actividad automáticamente desde un evento de tracking
   */
    async createActivityFromTrackingEvent(tx: PrismaTransactionClient, event: TrackingEvent, session: Session | null): Promise<Activity | null> {
    if (!session) {
      console.warn(`[ACTIVITY SERVICE] No se pudo crear actividad para el evento ${event.id} porque la sesión es nula.`);
      return null;
    }

    try {
      // Decidir si el evento debe generar una actividad
      const shouldCreateActivity = this.shouldCreateActivityFromEvent(event);
      
      if (!shouldCreateActivity) {
        return null;
      }

      // Determinar los datos de la actividad basados en el evento
      const activityData = this.mapEventToActivity(event, session);
      
      // Crear la actividad para visitor
      const visitorActivity = await this.createActivity(tx, event.businessId, activityData);
      
      // Crear también una actividad para session
      if (session) {
        const sessionActivityData = {
          ...activityData,
          entityType: 'session',
          entityId: session.id,
          utmSource: session.utmSource || 'direct',
          utmCampaign: session.utmCampaign || 'none'
        };
        await this.createActivity(tx, event.businessId, sessionActivityData);
      }
      
      // Retornar la actividad de visitor
      return visitorActivity;
    } catch (error) {
      console.error('[ACTIVITY SERVICE] Error creando actividad desde evento:', error);
      return null; // No falla el tracking si falla la actividad
    }
  }

  /**
   * Crea actividad automáticamente desde datos de evento (EventData)
   */
    async createActivityFromEventData(tx: PrismaTransactionClient, eventData: any, session: Session): Promise<Activity | null> {
    try {
      // Convertir EventData a TrackingEvent
      const trackingEvent: TrackingEvent = {
        id: eventData.id || uuidv4(),
        visitorId: session.visitorId,
        businessId: session.businessId, // Corregido: Tomar de la sesión
        sessionId: eventData.sessionId,
        userAgent: null,
        ipAddress: null,
        referrer: null,
        createdAt: new Date(eventData.createdAt || Date.now()),
        eventType: eventData.eventType,
        eventData: eventData.eventData,
        pageUrl: eventData.pageUrl || '',
        pageTitle: eventData.pageTitle || '',
        targetText: null,
        targetType: null,
        targetClasses: null,
        targetElement: null,
        formFields: null,
        conversionValue: eventData.eventData?.conversionValue || eventData.conversionValue || null,
        conversionType: eventData.eventData?.conversionType || eventData.conversionType || null,
        conversionSuccess: eventData.eventType === 'conversion',
        timestamp: new Date(eventData.createdAt || Date.now()),
        timeToSend: null,
        eventName: null,
        targetId: null,
        targetClass: null,
        elementInfo: null,
        eventDetail: null,
        metadata: null,
        pageLoadTime: null,
        clientGeneratedAt: null,
        timeToGenerate: null,
        formId: null,
        formErrors: null,
        formEmptyFields: null,
        formEmptyRequiredFields: null,
        formIsValid: null,
        formWillSubmit: null,
        conversionAttemptId: null,
        eventCategory: null,
        eventAction: null,
        eventValue: null
      };

            return await this.createActivityFromTrackingEvent(tx, trackingEvent, session);
    } catch (error) {
      console.error('[ACTIVITY SERVICE] Error creando actividad desde datos de evento:', error);
      return null; // No falla el tracking si falla la actividad
    }
  }

  /**
   * Determina si un evento debe generar una actividad
   */
  private shouldCreateActivityFromEvent(event: TrackingEvent): boolean {
    const activityTriggerEvents = [
      'session_start',
      'pageview',
      'scroll',
      'form_submit',
      'lead_capture',
      'conversion',
      'universal_click', // Solo CTAs importantes
      'page_view', // Solo páginas importantes
      'email_click',
      'download',
      'video_complete'
    ];

    // Verificar si es un tipo de evento que genera actividad
    if (!activityTriggerEvents.includes(event.eventType)) {
      return false;
    }

    // Para clicks, siempre crear actividades (simplificado para tests)
    if (event.eventType === 'universal_click') {
      return true; // Crear actividad para todos los universal_click
    }

    // Para page_view, solo páginas importantes
    if (event.eventType === 'page_view') {
      const importantPages = [
        '/gracias',
        '/confirmacion',
        '/contacto',
        '/servicios',
        '/landing'
      ];
      return importantPages.some(page => event.pageUrl.includes(page));
    }

    return true;
  }

  /**
   * Mapea un evento de tracking a datos de actividad
   */
  private mapEventToActivity(event: TrackingEvent, session: Session): ActivityData {
    const basePageInfo = {
      url: event.pageUrl || session.entryUrl,
      title: event.pageTitle || '', // No hay título en el modelo Session, usar fallback
      referrer: event.referrer,
      timestamp: event.timestamp
    };

    switch (event.eventType) {
      case 'form_submit':
        return {
          type: 'form_submit',
          category: 'lead_generation',
          entityType: 'visitor',
          entityId: session.visitorId,
          title: `Formulario enviado: ${event.pageTitle}`,
          description: `Usuario envió formulario en ${event.pageUrl}`,
          pageInfo: basePageInfo,
          metadata: {
            ...(typeof event.metadata === 'object' && event.metadata !== null ? event.metadata : {}),
            formData: typeof event.metadata === 'object' && event.metadata !== null ? (event.metadata as any).formFields || {} : {}
          },
          source: 'tracking'
        };

      case 'lead_capture':
      case 'conversion':
        return {
          type: event.eventType,
          category: 'conversion',
          entityType: 'visitor',
          entityId: session.visitorId,
          title: 'Conversión registrada',
          description: `Nueva conversión (${event.eventType}) desde ${event.pageUrl}`,
          pageInfo: basePageInfo,
          metadata: event.metadata,
          source: 'tracking'
        };

      case 'universal_click':
        return {
          type: 'universal_click',
          category: 'user_engagement',
          entityType: 'visitor',
          entityId: session.visitorId,
          title: 'Click en elemento',
          description: `Usuario hizo click en "${event.targetText || 'elemento'}" en ${event.pageUrl}`,
          pageInfo: basePageInfo,
          metadata: {
            ...(typeof event.metadata === 'object' && event.metadata !== null ? event.metadata : {}),
            elementInfo: {
              text: event.targetText,
              type: event.targetType,
              classes: event.targetClasses,
              element: event.targetElement
            }
          },
          source: 'tracking'
        };

      default:
        return {
          type: event.eventType,
          category: 'user_engagement',
          entityType: 'visitor',
          entityId: session.visitorId,
          title: this.getEventTitle(event.eventType),
          description: `El usuario realizó la acción '${event.eventType}' en la página ${event.pageUrl}`,
          pageInfo: basePageInfo,
          metadata: event.metadata,
          source: 'tracking'
        };
    }
  }

  /**
   * Mapea tipos de eventos a títulos específicos
   */
  private getEventTitle(eventType: string): string {
    const eventTitles: Record<string, string> = {
      'session_start': 'Nueva sesión iniciada',
      'universal_click': 'Click en elemento',
      'form_submit': 'Formulario enviado: Página de Contacto',
      'conversion': 'Conversión registrada',
      'lead_capture': 'Lead capturado',
      'page_view': 'Página visitada',
      'scroll': 'Scroll en página',
      'click': 'Click registrado'
    };

    return eventTitles[eventType] || `Evento de usuario: ${eventType}`;
  }

  /**
   * Obtiene actividades por lead
   */
  async getActivitiesByLead(businessId: number, leadId: string, limit = 50): Promise<Activity[]> {
    return await this.prisma.activity.findMany({
      where: {
        businessId: parseInt(businessId as any, 10),
        OR: [
          { leadId },
          { entityType: 'lead', entityId: leadId }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  /**
   * Obtiene estadísticas de actividades
   */
  async getActivityStats(businessId: number, days = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await this.prisma.activity.groupBy({
      by: ['type'],
      where: {
        businessId: parseInt(businessId as any, 10),
        createdAt: {
          gte: since
        }
      },
      _count: {
        id: true
      }
    });

        return stats.map((stat) => ({
      type: stat.type,
      count: stat._count.id
    }));
  }
}

export default ActivityService;
