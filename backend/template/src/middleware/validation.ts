// NUEVA VALIDACIÓN UNIFICADA - Solo para Leads
// Tracking validations movidas a validation/tracking-schemas.ts

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// ============================================
// ESQUEMAS PARA LEADS (No conflicta con tracking)
// ============================================

const leadSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  visitorId: Joi.string().uuid().required(),
  businessId: Joi.number().integer().required(),
  leadData: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    name: Joi.string().optional(),
    company: Joi.string().optional(),
    message: Joi.string().optional(),
    source: Joi.string().optional(),
    campaign: Joi.string().optional(),
    leadScore: Joi.number().integer().min(0).max(100).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'lost').optional()
  }).required(),
  metadata: Joi.object().optional(),
  timestamp: Joi.string().isoDate().optional(),
  createdAt: Joi.string().isoDate().optional()
});

// ============================================
// MIDDLEWARE DE VALIDACIÓN PARA LEADS
// ============================================

export const validateLeadPayload = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = leadSchema.validate(req.body, {
    allowUnknown: true,
    stripUnknown: false
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Payload de lead inválido',
      errors: error.details.map(detail => detail.message)
    });
  }

  req.body = value;
  next();
};
