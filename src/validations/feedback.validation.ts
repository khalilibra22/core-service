import Joi from "joi";

export const reviewValdationSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().optional(),
  comment: Joi.string().min(10).required(),
  teacherId: Joi.string().uuid().optional(),
  ownerId: Joi.string().uuid().optional(),
});

export const complaintValdationSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  reason: Joi.string().required(),
  type: Joi.string().required(),
});

export const complaintInitialResponseSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  initialResponse: Joi.string().min(5).required(),
});

export const resolveComplaintSchema = Joi.object({
  adminResponse: Joi.string().required(),
  ownerId: Joi.string().uuid().optional(),
});

export const studentDecisionComplaintSchema = Joi.object({
  studentDecision: Joi.string().valid("accepted", "escalated").required(),
  ownerId: Joi.string().uuid().optional(),
});
