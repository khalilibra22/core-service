import Joi from "joi";

export const enrollmentValidationsSchema = Joi.object({
  type: Joi.string()
    .valid("one-on-one", "live", "group", "prerecorded")
    .required(),
  studentId: Joi.string().uuid({ version: "uuidv4" }).required(),
  sessions: Joi.alternatives().conditional("type", {
    is: "one-on-one",
    then: Joi.array()
      .items(Joi.string().uuid({ version: "uuidv4" }))
      .min(1)
      .required(),
    otherwise: Joi.forbidden(),
  }),
});
