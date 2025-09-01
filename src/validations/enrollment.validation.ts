import Joi from "joi";

export const enrollmentValidationsSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
});

export const enrollmentStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  ownerId: Joi.string().uuid().required(),
});

export const oneOnOneEnrollmentSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  topicId: Joi.number().integer().min(1).required(),
  teacherId: Joi.string().uuid({ version: "uuidv4" }).required(),
  availabilityIds: Joi.array()
    .items(Joi.string().uuid({ version: "uuidv4" }))
    .min(1)
    .required(),
  sessionsNumber: Joi.number()
    .integer()
    .min(1)
    .when("isPaid", {
      is: false,
      then: Joi.valid(1).required(), // only 1 allowed if not paid
      otherwise: Joi.number().integer().min(1).required(),
    }),
  isPaid: Joi.boolean().required(),
})
  .custom((value, helpers) => {
    if (value.availabilityIds.length > value.sessionsNumber) {
      return helpers.error("availabilityIds.greaterThanSessions", {
        availability: value.availabilityIds.length,
        sessions: value.sessionsNumber,
      });
    }
    return value;
  }, "availability vs sessions validation")
  .messages({
    "availabilityIds.greaterThanSessions": `"availabilityIds" count ({{#availability}}) must not be greater than sessionsNumber ({{#sessions}})`,
  });

export const cancelOneOnOneEnrollmentShcema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  reason: Joi.string().min(5).required(),
});

export const refundValdationSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  reason: Joi.string().required(),
});

export const refundInitialResponseSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  amount: Joi.number().min(0).required(),
  initialResponse: Joi.string().min(5).required(),
});

export const resolveRefundSchema = Joi.object({
  amount: Joi.number().min(0).required(),
  adminResponse: Joi.string().required(),
  ownerId: Joi.string().uuid().optional(),
});

export const refundStudentDecisionSchema = Joi.object({
  studentDecision: Joi.string().valid("accepted", "escalated").required(),
  ownerId: Joi.string().uuid().optional(),
});
