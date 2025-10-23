import Joi from "joi";

const keyValue = Joi.object().pattern(Joi.string(), Joi.string());

export const sendToTokensSchema = Joi.object({
  title: Joi.string().min(1).required(),
  body: Joi.string().min(1).required(),
  data: keyValue.optional(),
  imageUrl: Joi.string().uri().optional(),
  tokens: Joi.array().items(Joi.string().min(10)).min(1).max(500).required(),
  android: Joi.object().unknown(true).optional(),
  apns: Joi.object().unknown(true).optional(),
  webpush: Joi.object().unknown(true).optional(),
  ownerId: Joi.string().uuid().optional(),
  user: Joi.object().optional(),
});

export const sendToTopicSchema = Joi.object({
  title: Joi.string().min(1).required(),
  body: Joi.string().min(1).required(),
  data: keyValue.optional(),
  imageUrl: Joi.string().uri().optional(),
  topic: Joi.string()
    .pattern(/^[a-zA-Z0-9-_.~%]+$/)
    .min(1)
    .required(),
  android: Joi.object().unknown(true).optional(),
  apns: Joi.object().unknown(true).optional(),
  webpush: Joi.object().unknown(true).optional(),
  ownerId: Joi.string().uuid().optional(),
  user: Joi.object().optional(),
});

export const topicSubscriptionSchema = Joi.object({
  token: Joi.string().min(10).required(),
  topic: Joi.string().pattern(/^[a-zA-Z0-9-_.~%]+$/).min(1).required(),
  ownerId: Joi.string().uuid().optional(),
  user: Joi.object().optional(),
});


