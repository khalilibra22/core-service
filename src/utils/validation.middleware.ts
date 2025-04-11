import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

class ValidationMiddleware {
  static validate(schema: Schema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
          res.status(400).json({
            error: error.details.map((detail) => detail.message),
          });
          return;
        }
        next();
      } catch (err) {
        console.error("Validation Middleware Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    };
  }
}

export { ValidationMiddleware };
