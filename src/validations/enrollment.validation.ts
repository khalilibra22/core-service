import Joi from "joi";

export const enrollmentValidationsSchema = Joi.object({
  type: Joi.string().valid("live", "group", "prerecorded").required(),
  ownerId: Joi.string().uuid().optional(),
});

export const enrollmentStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  ownerId: Joi.string().uuid().required(),
});

export const oneOnOneEnrollmentSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  topicId: Joi.number().integer().min(1).required(),
  availabilityIds: Joi.array()
    .items(Joi.string().uuid({ version: "uuidv4" }))
    .min(1)
    .required(),
  sessionsNumber: Joi.number().integer().min(1).required(),
  isPaid: Joi.boolean().required(),
});
