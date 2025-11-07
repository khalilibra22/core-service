import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

class ValidationMiddleware {
  static validate(schema: Schema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        // Temporarily remove auth-injected fields to avoid validation errors
        const { userRole,...bodyToValidate } = req.body;
        
        const { error } = schema.validate(bodyToValidate, { abortEarly: false });
        if (error) {
          res.status(400).json({
            error: error.details.map((detail) => detail.message),
          });
          return;
        }
        
        // Restore auth-injected fields after validation
        if (userRole !== undefined) req.body.userRole = userRole;
        
        next();
      } catch (err) {
        console.error("Validation Middleware Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    };
  }
}

export { ValidationMiddleware };
