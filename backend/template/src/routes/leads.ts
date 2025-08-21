import express, { Request, Response, NextFunction } from 'express';
import { LeadStatus } from '@prisma/client';
import { LeadService } from '../services/leadService';
import { validateLeadPayload } from '../middleware/validation';

const router = express.Router();
const leadService = new LeadService();

/**
 * ENDPOINT PARA CAPTURAR LEADS
 * Recibe formularios y los convierte en leads con contexto de tracking
 */
router.post('/capture', validateLeadPayload, async (req: Request, res: Response) => {
  try {
    console.log('🎯 [LEADS API] Lead recibido:', JSON.stringify(req.body, null, 2));
    
    const leadData = req.body;
    const processedLead = await leadService.createLead(leadData);
    
    console.log('✅ [LEADS API] Lead procesado:', processedLead.id);

    res.status(201).json({
      success: true,
      message: 'Lead capturado correctamente',
      data: {
        leadId: processedLead.id,
        email: processedLead.email,
        source: processedLead.source,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ [LEADS API] Error capturando lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error capturando lead',
      message: error.message
    });
  }
});

/**
 * ENDPOINT PARA OBTENER LEADS
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { businessId, status, limit = 50, offset = 0 } = req.query;

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ success: false, message: 'El parámetro businessId es requerido y debe ser un string.' });
    }

    const numericBusinessId = parseInt(businessId, 10);

    if (isNaN(numericBusinessId)) {
      return res.status(400).json({ success: false, error: 'Formato de businessId inválido. Debe ser un número.' });
    }

    const leads = await leadService.getLeads({
      businessId: numericBusinessId,
      status: status ? (status as LeadStatus) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.status(200).json({
      success: true,
      data: leads
    });

  } catch (error: any) {
    console.error('❌ [LEADS API] Error obteniendo leads:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo leads',
      message: error.message
    });
  }
});

/**
 * ENDPOINT PARA OBTENER UN LEAD ESPECÍFICO
 */
router.get('/:leadId', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const lead = await leadService.getLead(leadId);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });

  } catch (error: any) {
    console.error('❌ [LEADS API] Error obteniendo lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo lead',
      message: error.message
    });
  }
});

/**
 * ENDPOINT PARA ACTUALIZAR ESTADO DE LEAD
 */
router.patch('/:leadId/status', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { status, stage, notes, assignedTo } = req.body;

    const updatedLead = await leadService.updateLeadStatus(leadId, {
      status: status as string | undefined,
      stage: stage as string | undefined,
      notes: notes as string | undefined,
      assignedTo: assignedTo as string | undefined
    });

    res.status(200).json({
      success: true,
      message: 'Lead actualizado correctamente',
      data: updatedLead
    });

  } catch (error: any) {
    console.error('❌ [LEADS API] Error actualizando lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando lead',
      message: error.message
    });
  }
});

/**
 * ENDPOINT PARA ESTADÍSTICAS DE LEADS
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.query;

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ success: false, message: 'El parámetro businessId es requerido y debe ser un string.' });
    }

    const numericBusinessId = parseInt(businessId, 10);

    if (isNaN(numericBusinessId)) {
      return res.status(400).json({ success: false, error: 'Formato de businessId inválido. Debe ser un número.' });
    }

    const stats = await leadService.getLeadStats(numericBusinessId);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ [LEADS API] Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas',
      message: error.message
    });
  }
});

export default router;
