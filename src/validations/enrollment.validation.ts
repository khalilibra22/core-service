import Joi from "joi";

export const enrollmentValidationsSchema = Joi.object({
  type: Joi.string()
    .valid("one-on-one", "live", "group", "prerecorded")
    .required(),
  ownerId: Joi.string().uuid().optional(),
  availabilityIds: Joi.alternatives().conditional("type", {
    is: "one-on-one",
    then: Joi.array()
      .items(Joi.string().uuid({ version: "uuidv4" }))
      .min(1)
      .required(),
    otherwise: Joi.forbidden(),
  }),
});

export const enrollmentStatusSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  ownerId: Joi.string().uuid().required(),
});
