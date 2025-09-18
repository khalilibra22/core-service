import Joi from "joi";

export const uploadValidationSchema = Joi.object({
    // NOTE: Joi does not natively validate multipart file uploads (req.file) in Express.
    // The 'file' field here is for documentation purposes only.
    file: Joi.any().optional().description('file (handled by multer, not Joi)'),
    ownerId: Joi.string().uuid().optional(),
});
