import Joi from "joi";

export const quizValidation = Joi.object({
  title: Joi.string().required().min(1).max(200),
  description: Joi.string().optional().min(1).max(1000),
  order: Joi.number().integer().min(0).required(),
  ownerId: Joi.string().uuid().optional(),
});

export const quizQuestionValidation = Joi.object({
  question: Joi.string().required().min(1).max(500),
  options: Joi.array()
    .items(Joi.string().trim().min(1).max(500))
    .min(2)
    .max(10)
    .required(),
  points: Joi.number().integer().min(1).max(100).required(),
  explanation: Joi.string().optional().min(1).max(1000),
  answer: Joi.string()
    .trim()
    .required()
    .min(1)
    .max(500)
    .custom((value, helpers) => {
      if (!helpers.state.ancestors[0].options.includes(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }),
  ownerId: Joi.string().uuid().optional(),
});

export const submitQuizAttemptValidation = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().uuid().required(),
        answer: Joi.string().trim().required().min(1).max(500),
      })
    )
    .min(1)
    .required(),
  timeTaken: Joi.number().integer().min(0).optional(),
  ownerId: Joi.string().uuid().optional(),
});