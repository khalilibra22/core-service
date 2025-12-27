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
  description: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
});

export const issueValidationSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  referenceId: Joi.string().optional(),
  sessionId: Joi.string().optional(),
  enrollmentId: Joi.string().optional(),
  courseId: Joi.string().optional(),
  issueType: Joi.string()
    .valid(
      "LATE_START",
      "NO_SHOW",
      "TECHNICAL_ISSUE",
      "TEACHING_QUALITY",
      "REFUND_REQUEST"
    )
    .required(),
  description: Joi.string().required(),
  attachments: Joi.array().items(Joi.string()).optional(),
});

export const tutorReplySchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  message: Joi.string().min(5).required(),
  proposedRefund: Joi.number().valid(0, 50, 100).optional(),
  refundOption: Joi.string().valid("refund_100", "refund_50", "refund_0").optional(),
}).or("proposedRefund", "refundOption");

export const resolveComplaintSchema = Joi.object({
  adminResponse: Joi.string().required(),
  ownerId: Joi.string().uuid().optional(),
});

export const studentDecisionComplaintSchema = Joi.object({
  studentDecision: Joi.string().valid("accepted", "escalated").required(),
  reason: Joi.string().optional(),
  ownerId: Joi.string().uuid().optional(),
});

export const adminDecisionSchema = Joi.object({
  decision: Joi.string().valid("REFUND", "REJECT", "RESOLVE").required(),
  note: Joi.string().optional(),
  refundAmount: Joi.number().min(0).when("decision", {
    is: "REFUND",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  ownerId: Joi.string().uuid().optional(),
});
