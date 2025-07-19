import Joi from "joi";

export const createCourseValidationSchema = Joi.object({
  ownerId: Joi.string().uuid().optional(),
  type: Joi.string()
    .valid("one-on-one", "group", "live", "prerecorded")
    .required(),
});

// Shared Fields
const sharedFields = {
  name: Joi.string().required(),
  description: Joi.string().required(),
  topicId: Joi.number().required(),
  isPaid: Joi.boolean().required(),
  price: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  isRemote: Joi.boolean().required(),
  ownerId: Joi.string().uuid().optional(),
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
  introVideo: Joi.string().uri().optional(),
  thumbnail: Joi.string().uri().optional(),
  objectives: Joi.array().items(Joi.string()).required(),
  prerequisites: Joi.array().items(Joi.string()).required(),
  targetAudience: Joi.array().items(Joi.string()).required(),
  isCertified: Joi.boolean().required(),
  certificateType: Joi.string().required(),
  certificateShippingType: Joi.string().required(),
});

// Prerecorded schema
const prerecordedSchema = Joi.object({
  type: Joi.string().valid("prerecorded").required(),
  ...sharedFields,
  instructorId: Joi.string().uuid().optional(),
  address: Joi.string().required(),
  grade: Joi.string().required(),
  introVideo: Joi.string().uri().optional(),
  thumbnail: Joi.string().uri().optional(),
  age: Joi.number().integer().min(0).required(),
  objectives: Joi.array().items(Joi.string()).required(),
  prerequisites: Joi.array().items(Joi.string()).required(),
  targetAudience: Joi.array().items(Joi.string()).required(),
  isCertified: Joi.boolean().required(),
  certificateType: Joi.string().required(),
  certificateShippingType: Joi.string().required(),
});

const oneOnOneSchema = Joi.object({
  type: Joi.string().valid("one-on-one").required(),
});

const sessionSchema = Joi.object({
  type: Joi.string().valid("one-on-one", "group", "live").required(),
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
  ordering: Joi.number().integer().min(1).required(),
  video: Joi.object().optional(),
  ownerId: Joi.string().uuid().optional(),
});

export const courseValidationSchema = Joi.alternatives()
  .try(groupSchema, liveSchema, prerecordedSchema, oneOnOneSchema)
  .messages({
    "alternatives.match":
      "Course data is invalid or does not match any allowed course type (one-on-one, group, live, prerecorded).",
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
  requestedTime: Joi.date().greater("now").required(),
  ownerId: Joi.string().uuid().optional(),
  reason: Joi.string().required(),
});

export const courseCancellationValidationSchema = Joi.object({
  reasonOfCancellation: Joi.string().required(),
  ownerId: Joi.string().uuid().optional(),
});

export const timeChangeRequestStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  ownerId: Joi.string().uuid().optional(),
});
