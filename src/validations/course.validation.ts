import Joi from "joi";

export const createCourseValidationSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  type: Joi.string().valid("group", "live", "prerecorded").required(),
});

// Shared Fields
const sharedFields = {
  name: Joi.string().required(),
  description: Joi.string().required(),
  topicId: Joi.number().required(),
  subjectId: Joi.number().optional(),
  isPaid: Joi.boolean().required(),
  price: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  isRemote: Joi.boolean().required(),
  couponApplicable: Joi.boolean().required(),
  language: Joi.string().optional(),
  ownerId: Joi.string().uuid().optional(),
  fcmToken: Joi.string().min(10).optional(),
};

// Base schema for group
const groupSchema = Joi.object({
  type: Joi.string().valid("group").required(),
  ...sharedFields,
  maxParticipants: Joi.number().integer().min(1).required(),
});

// Live schema
const liveSchema = Joi.object({
  type: Joi.string().valid("live").required(),
  ...sharedFields,
  instructorId: Joi.string().uuid().optional(),
  maxParticipants: Joi.number().integer().min(1).required(),
  address: Joi.string().required(),
  grade: Joi.string().required(),
  introVideo: Joi.string().optional(),
  thumbnail: Joi.string().optional(),
  objectives: Joi.array().items(Joi.string()).optional(),
  prerequisites: Joi.array().items(Joi.string()).optional(),
  targetAudience: Joi.array().items(Joi.string()).optional(),
  isCertified: Joi.boolean().required(),
  certificateType: Joi.string().when("isCertified", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  internationalAccordingOrganization: Joi.string().when("isCertified", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  accordinationNumber: Joi.string().when("isCertified", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  certificateShippingType: Joi.string().when("isCertified", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

// Prerecorded schema
const prerecordedSchema = Joi.object({
  type: Joi.string().valid("prerecorded").required(),
  ...sharedFields,
  instructorId: Joi.string().uuid().optional(),
  address: Joi.string().required(),
  grade: Joi.string().required(),
  introVideo: Joi.string().optional(),
  thumbnail: Joi.string().optional(),
  age: Joi.number().integer().min(0).required(),
  objectives: Joi.array().items(Joi.string()).optional(),
  prerequisites: Joi.array().items(Joi.string()).optional(),
  targetAudience: Joi.array().items(Joi.string()).optional(),
  isCertified: Joi.boolean().required(),
  certificateType: Joi.string().when("isCertified", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  certificateShippingType: Joi.string().when("isCertified", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

const sessionSchema = Joi.object({
  type: Joi.string().valid("group", "live").required(),
  date: Joi.date().timestamp().required(),
  duration: Joi.number().min(1).required(),
  durationUnit: Joi.string().valid("minute", "hour").required(),
  topicId: Joi.number().integer().optional(),
  title: Joi.string().optional(),
  isPaid: Joi.boolean().optional(),
  ownerId: Joi.string().uuid().optional(),
});

const prerecordedSessionSchema = Joi.object({
  type: Joi.string().valid("prerecorded").required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  order: Joi.number().integer().min(0).required(),
  ownerId: Joi.string().uuid().optional(),
});

export const courseValidationSchema = Joi.alternatives()
  .try(groupSchema, liveSchema, prerecordedSchema)
  .messages({
    "alternatives.match":
      "Course data is invalid or does not match any allowed course type ( group, live, prerecorded).",
  });

export const sessionValidationSchema = Joi.alternatives()
  .try(sessionSchema, prerecordedSessionSchema)
  .messages({
    "alternatives.match":
      "Data is invalid or does not match allowed structure for its type.",
  });

export const certificateValidationSchema = Joi.object({
  studentId: Joi.string().uuid({ version: "uuidv4" }).required(),
  issueDate: Joi.date().required(),
  expirationDate: Joi.date().greater(Joi.ref("issueDate")).optional(),
  issuedBy: Joi.string().min(2).max(100).required(),
  certificateUrl: Joi.string().optional(),
  ownerId: Joi.string().uuid().optional(),
});

export const timeChangeRequestValidationSchema = Joi.object({
  availabilityId: Joi.string().required(),
  reason: Joi.string().required(),
  ownerId: Joi.string().uuid().optional(),
});

export const courseCancellationValidationSchema = Joi.object({
  reasonOfCancellation: Joi.string().required(),
  ownerId: Joi.string().uuid().optional(),
});

export const timeChangeRequestStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  ownerId: Joi.string().uuid().optional(),
});

export const lessonValidationSchema = Joi.alternatives()
  .try(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      type: Joi.string().valid("video").required(),
      videoUrl: Joi.string().required(),
      order: Joi.number().integer().min(0).required(),
      ownerId: Joi.string().uuid().optional(),
    }),
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().optional(),
      type: Joi.string().valid("documents").required(),
      materials: Joi.array()
        .items(
          Joi.string().uuid().required()
        )
        .min(1)
        .required(),
      order: Joi.number().integer().min(0).required(),
      ownerId: Joi.string().uuid().optional(),
    })
  )
  .messages({
    "alternatives.match":
      "Lesson data is invalid or does not match any allowed lesson type (video, documents).",
  });

export const courseMaterialsSchema = Joi.object({
  materials: Joi.array()
    .items(Joi.string().uuid().required())
    .min(1)
    .required().min(1),
  ownerId: Joi.string().uuid().optional(),
});

export const removeMaterialsSchema = Joi.object({
  materialIds: Joi.array()
    .items(Joi.string().uuid().required())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one material ID is required',
      'array.base': 'materialIds must be an array',
      'any.required': 'materialIds is required',
    }),
  ownerId: Joi.string().uuid().optional(),
});

// toggle lesson material share
export const toggleLessonMaterialShareValidationSchema = Joi.object({
  isSharable: Joi.boolean().required(),
  ownerId: Joi.string().uuid().optional(),
});

// Student request validation schemas
export const createStudentRequestValidationSchema = Joi.object({
  type: Joi.string()
    .valid("certificate", "general")
    .required()
    .messages({
      "any.only": "Type must be one of: certificate, general",
      "any.required": "Request type is required",
    }),
  message: Joi.string().max(1000).optional(),
  payload: Joi.object().optional(),
  ownerId: Joi.string().uuid().optional(),
});

export const updateStudentRequestStatusValidationSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "preparing", "dispatched", "delivered", "rejected", "completed")
    .required()
    .messages({
      "any.only": "Status must be one of: pending, preparing, dispatched, delivered, rejected, completed",
      "any.required": "Status is required",
    }),
  ownerResponse: Joi.string().max(1000).optional(),
  ownerId: Joi.string().uuid().optional(),
});

// Course progress validation schemas
export const updateCourseProgressValidationSchema = Joi.object({
  percentComplete: Joi.number().min(0).max(100).required(),
  lastSessionId: Joi.string().uuid().optional(),
  lastLessonId: Joi.string().uuid().optional(),
  ownerId: Joi.string().uuid().optional(),
}).or("percentComplete", "lastSessionId", "lastLessonId").messages({
  "object.missing": "At least one of percentComplete, lastSessionId, or lastLessonId must be provided",
});

