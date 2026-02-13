import Joi from "joi";

export const enrollmentValidationsSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  fcmToken: Joi.string().min(10).optional(),
});

export const enrollmentStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected", "pending").required(),
  ownerId: Joi.string().uuid().required(),
});

export const oneOnOneEnrollmentSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  topicId: Joi.number().integer().min(1).required(),
  teacherId: Joi.string().uuid({ version: "uuidv4" }).required(),
  availabilityIds: Joi.array()
    .items(Joi.string().uuid({ version: "uuidv4" }))
    .min(1)
    .when("sessions", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
  sessionsNumber: Joi.number()
    .integer()
    .min(1)
    .when("sessions", {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.when("isPaid", {
        is: false,
        then: Joi.valid(1).required(), // only 1 allowed if not paid
        otherwise: Joi.number().integer().min(1).required(),
      }),
    }),
  sessions: Joi.array().items(
    Joi.object({
      availabilityId: Joi.string().uuid({ version: "uuidv4" }).required(),
      date: Joi.date().iso().required(),
    })
  ).min(1).optional(),
  isPaid: Joi.boolean().required(),
  fcmToken: Joi.string().min(10).optional(),
})
  .custom((value, helpers) => {
    if (value.sessions) {
      // If sessions are provided, we don't strictly need sessionsNumber or availabilityIds in the traditional sense,
      // but let's ensure consistency if they ARE provided.
      if (value.sessionsNumber && value.sessions.length !== value.sessionsNumber) {
        // Actually, user said we don't need sessions.length matching sessionsNumber strictly if manually provided?
        // "we dont need it , i think , right??" -> Refers to my proposed validation "sessions.length matches sessionsNumber".
        // So I'll remove that strict check.
      }
      
      // If not paid, only 1 session allowed
      if (!value.isPaid && value.sessions.length > 1) {
          return helpers.error("sessions.tooManyForUnpaid");
      }
    } else {
        if (!value.availabilityIds || value.availabilityIds.length === 0) {
            return helpers.error("availabilityIds.requiredWithoutSessions");
        }
        if (!value.sessionsNumber) {
             return helpers.error("sessionsNumber.requiredWithoutSessions");
        }
        if (value.availabilityIds.length > value.sessionsNumber) {
          return helpers.error("availabilityIds.greaterThanSessions", {
            availability: value.availabilityIds.length,
            sessions: value.sessionsNumber,
          });
        }
    }
    return value;
  }, "one-on-one enrollment custom validation")
  .messages({
    "availabilityIds.greaterThanSessions": `"availabilityIds" count ({{#availability}}) must not be greater than sessionsNumber ({{#sessions}})`,
    "sessions.tooManyForUnpaid": `Only 1 session is allowed for unpaid enrollments`,
    "availabilityIds.requiredWithoutSessions": `"availabilityIds" is required when "sessions" is not provided`,
    "sessionsNumber.requiredWithoutSessions": `"sessionsNumber" is required when "sessions" is not provided`,
  });

export const cancelEnrollmentShcema = Joi.object({
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
