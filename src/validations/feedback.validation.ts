import Joi from "joi";

export const reviewValdationSchema = Joi.object({
  studentId: Joi.string().uuid({ version: "uuidv4" }).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().optional(),
  comment: Joi.string().min(10).required(),
});

export const complaintValdationSchema = Joi.object({
  studentId: Joi.string().uuid({ version: "uuidv4" }).required(),
  reason: Joi.string().required(),
});

export const complaintStatusSchema = Joi.object({
  status: Joi.string().valid("under review", "rejected").required(),
});

export const resolveComplaintSchema = Joi.object({
  response: Joi.string().required(),
  adminId: Joi.string().uuid({ version: "uuidv4" }).required(),
});
