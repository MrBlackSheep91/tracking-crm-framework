import { PrismaClient, Lead, Session, Visitor, Prisma, LeadStatus, LeadStage } from '@prisma/client';

const prisma = new PrismaClient();

interface LeadData {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  sessionId?: string;
  visitorId?: string;
  businessId: number;
  source?: string;
  formType?: string;
  conversionPage?: string;
  customFields?: any;
  utmData?: any;
  // Campos de atribución
  campaignId?: string;
  campaignName?: string;
  medium?: string;
  content?: string;
  term?: string;
  fbclid?: string;
}

interface LeadFilters {
  businessId?: number;
  status?: LeadStatus;
  limit?: number;
  offset?: number;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  source?: string;
}

interface LeadUpdateData {
  status?: string;
  stage?: string;
  notes?: string;
  assignedTo?: string;
}

export class LeadService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Crea un nuevo lead con contexto completo de tracking
   */
  async createLead(leadData: LeadData): Promise<Lead> {
    try {
      console.log('📊 [LEAD SERVICE] Creando lead:', leadData.email || 'sin email');

      // Buscar la sesión asociada si existe
      let session: Session | null = null;
      let visitor: Visitor | null = null;

      if (leadData.sessionId) {
        session = await this.prisma.session.findUnique({
          where: { id: leadData.sessionId }
        });
        if (session) {
          visitor = await this.prisma.visitor.findUnique({
            where: { id: session.visitorId }
          });
        }
      }

      // Crear el lead - visitorId es obligatorio, crear visitor si no existe
      if (!visitor && leadData.visitorId) {
        visitor = await this.prisma.visitor.findUnique({
          where: { id: leadData.visitorId }
        });
      }
      
      // Si aún no hay visitor, crear uno básico
      if (!visitor) {
        visitor = await this.prisma.visitor.create({
          data: {
            businessId: leadData.businessId,
            visitorId: `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 🔧 CORRECCIÓN: Campo requerido
            fingerprint: `lead-${Date.now()}`,
            clientIP: 'unknown',
            firstVisitAt: new Date(),
            lastVisitAt: new Date()
          }
        });
      }

      const lead = await this.prisma.lead.create({
        data: {
          businessId: leadData.businessId,
          visitorId: visitor.id,
          sessionId: session?.id,

          // Información de contacto
          email: leadData.email || null,
          firstName: leadData.firstName || null,
          lastName: leadData.lastName || null,
          name: leadData.name || (leadData.firstName && leadData.lastName ? `${leadData.firstName} ${leadData.lastName}` : leadData.firstName || leadData.lastName) || null,
          phone: leadData.phone || null,
          company: leadData.company || null,
          jobTitle: leadData.jobTitle || null,

          // Contexto de conversión, clasificación y atribución
          source: session?.utmSource || leadData.source || 'unknown',
          medium: session?.utmMedium || null,
          campaignName: session?.utmCampaign || null,
          term: session?.utmTerm || null,
          content: session?.utmContent || null,
          leadType: leadData.formType || 'unknown', // Mapeado a 'leadType' que sí existe

          // Estado inicial
          status: 'NEW',
          stage: 'AWARENESS',
        }
      });

      // Actualizar el visitante si existe
      if (visitor) {
        await this.prisma.visitor.update({
          where: { id: visitor.id },
          data: {
            lastVisitAt: new Date()
          }
        });
      }

      // Registrar evento de conversión
      if (session) {
        await this.prisma.trackingEvent.create({
          data: {
            businessId: leadData.businessId,
            visitorId: leadData.visitorId || 'unknown',
            sessionId: leadData.sessionId || 'unknown',
            eventType: 'lead_conversion',
            eventCategory: 'Conversion',
            eventAction: 'Lead Captured',
            pageUrl: leadData.conversionPage || 'unknown',
            metadata: {
              leadId: lead.id,
              formType: leadData.formType,
              source: leadData.source,
            },
          },
        });
      }

      console.log(' [LEAD SERVICE] Lead creado exitosamente:', lead.id);
      return lead;

    } catch (error) {
      console.error(' [LEAD SERVICE] Error creando lead:', error);
      throw error;
    }
  }

  /**
   * Obtiene leads con filtros
   */
  async getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
    try {
      const { businessId, email, phone, firstName, lastName, name, source, ...rest } = filters;
      const whereClause: Prisma.LeadWhereInput = { businessId };
      if (email) whereClause.email = email;
      if (phone) whereClause.phone = phone;
      if (firstName) {
        whereClause.firstName = { contains: firstName, mode: 'insensitive' };
      }
      if (lastName) {
        whereClause.lastName = { contains: lastName, mode: 'insensitive' };
      }
      if (source) whereClause.source = source;

      const leads = await this.prisma.lead.findMany({
        where: whereClause,
        include: {
          visitor: {
            select: {
              id: true,
              fingerprint: true,
              clientIP: true,
              country: true,
              firstVisitAt: true
            }
          },
          session: {
            select: {
              id: true,
              startedAt: true,
    
              utmSource: true,
              utmMedium: true,
              utmCampaign: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0
      });

      return leads;
    } catch (error) {
      console.error(' [LEAD SERVICE] Error obteniendo leads:', error);
      throw error;
    }
  }

  /**
   * Obtiene un lead específico con contexto completo
   */
  async getLead(leadId: string): Promise<Lead | null> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          session: {
            include: {
              TrackingEvent: {
                orderBy: { createdAt: 'asc' },
                take: 100
              }
            }
          },
          visitor: {
            include: {
              sessions: {
                orderBy: { startedAt: 'desc' },
                take: 10
              }
            }
          }
        }
      });

      return lead;
    } catch (error) {
      console.error(' [LEAD SERVICE] Error obteniendo lead:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un lead
   */
  async updateLeadStatus(leadId: string, updateData: LeadUpdateData): Promise<Lead> {
    try {
      const lead = await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          status: updateData.status as LeadStatus | undefined,
          stage: updateData.stage as LeadStage | undefined,
          updatedAt: new Date()
        }
      });

      return lead;
    } catch (error) {
      console.error(' [LEAD SERVICE] Error actualizando lead:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de leads
   */
  async getLeadStats(businessId?: number): Promise<any> {
    try {
      const businessIdAsNumber = typeof businessId === 'string' ? parseInt(businessId, 10) : businessId;
      const baseWhere = businessIdAsNumber ? { businessId: businessIdAsNumber } : {};

      // Conteo por estado
      const statusCounts = await this.prisma.lead.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { id: true }
      });

      // Conteo por fuente
      const sourceCounts = await this.prisma.lead.groupBy({
        by: ['source'],
        where: baseWhere,
        _count: { id: true }
      });

      // Leads por fecha (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyLeads = await this.prisma.lead.groupBy({
        by: ['createdAt'],
        where: {
          ...baseWhere,
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { id: true }
      });

      // Tasa de conversión
      const totalVisitors = await this.prisma.visitor.count({
        where: baseWhere
      });

      const totalLeads = await this.prisma.lead.count({
        where: baseWhere
      });

      const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors * 100).toFixed(2) : 0;

      return {
        total: totalLeads,
        byStatus: statusCounts.reduce((acc: any, item: any) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        bySource: sourceCounts.reduce((acc: any, item: any) => {
          acc[item.source || 'unknown'] = item._count.id;
          return acc;
        }, {}),
        dailyTrend: dailyLeads,
        conversionRate: parseFloat(conversionRate.toString()),
        totalVisitors
      };
    } catch (error) {
      console.error(' [LEAD SERVICE] Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Calcula el score inicial del lead
   */
  calculateInitialScore(leadData: LeadData, session: Session | null): number {
    let score = 0;

    // Score por información proporcionada
    if (leadData.email) score += 20;
    if (leadData.phone) score += 15;
    if (leadData.company) score += 10;
    if (leadData.jobTitle) score += 10;
    if (leadData.name && leadData.name.length > 5) score += 15;

    // Score por comportamiento de sesión
    if (session) {
      // Bonus por UTM tracking (indica campaña dirigida)
      if (session.utmSource) score += 5;
      if (session.utmCampaign) score += 5;
    }

    // Score por fuente
    if (leadData.source) {
      if (leadData.source.includes('contact')) score += 15;
      if (leadData.source.includes('quote')) score += 20;
      if (leadData.source.includes('demo')) score += 25;
    }

    return Math.min(score, 100); // Máximo 100
  }

  /**
   * Enriquece un lead con datos adicionales
   */
  // Este método queda obsoleto ya que no hay un campo 'customFields' en el modelo Lead.
  // Se podría reimplementar si se añade un modelo de campos personalizados relacionado.
  /*
  async enrichLead(leadId: string, enrichmentData: any): Promise<Lead> {
    try {
      const updatedLead = await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          // Lógica de enriquecimiento a implementar si se añaden campos para ello
          updatedAt: new Date()
        }
      });

      return updatedLead;
    } catch (error) {
      console.error('❌ [LEAD SERVICE] Error enriqueciendo lead:', error);
      throw error;
    }
  }
  */
}
