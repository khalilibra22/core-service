import multer from "multer";
import { Request, Response, NextFunction } from "express";

export const handleMulterError = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                return res.status(400).json({
                    error: "File too large",
                    message: "File size exceeds the 10MB limit",
                });
            case "LIMIT_FILE_COUNT":
                return res.status(400).json({
                    error: "Too many files",
                    message: "Only one file is allowed per upload",
                });
            case "LIMIT_UNEXPECTED_FILE":
                return res.status(400).json({
                    error: "Unexpected field",
                    message: 'Unexpected file field. Expected field name: "file"',
                });
            default:
                return res.status(400).json({
                    error: "Upload error",
                    message:
                        error.message || 'Field name missing. Expected field name: "file"',
                });
        }
    }
    next(error);
};
