import Joi from "joi";

export const meetingValidationSchema = Joi.object({
  name: Joi.string().required(),
  meetingID: Joi.string().required(),
  moderatorPW: Joi.string().required(),
  attendeePW: Joi.string().required(),
  duration: Joi.string().optional(),
});

export const joinMeetingValidationSchema = Joi.object({
  fullname: Joi.string().required(),
  password: Joi.string().required(),
});

export const endMeetingValidationSchema = Joi.object({
  password: Joi.string().required(),
});
