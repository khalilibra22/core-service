import Joi from "joi";

export const reviewValdationSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().optional(),
  comment: Joi.string().min(10).required(),
  ownerId: Joi.string().uuid().optional(),
});

export const complaintValdationSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  reason: Joi.string().required(),
});

export const complaintStatusSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  status: Joi.string().valid("under review", "rejected").required(),
});

export const resolveComplaintSchema = Joi.object({
  response: Joi.string().required(),
  ownerId: Joi.string().uuid().optional(),
});
