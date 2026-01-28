import express from "express";
import { StudentRequestController } from "../../controllers/student-request.controller";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { container } from "tsyringe";

const router = express.Router();

const studentRequestController = container.resolve(StudentRequestController);

// Create a student request for a specific course
// router.post(
//     "/courses/:courseId/requests",
//     AuthMiddleware.verifyToken,
//     AuthMiddleware.authorize("courses", "view"),
//     ValidationMiddleware.validate(createStudentRequestValidationSchema),
//     studentRequestController.createStudentRequest
// );

// Get all student requests for the authenticated student
router.get(
    "/my-requests",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("courses", "view"),
    studentRequestController.getStudentRequestsByStudentId
);

// Get all student requests for courses owned by the authenticated instructor
router.get(
    "/instructor-requests",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("courses", "manage_courses"),
    studentRequestController.getStudentRequestsByOwnerId
);

// Get a specific student request by ID
router.get(
    "/:id",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorize("courses", "view"),
    studentRequestController.getStudentRequestById
);

// // Update student request status
// router.patch(
//     "/:id/status",
//     AuthMiddleware.verifyToken,
//     AuthMiddleware.authorize("courses", "manage_courses"),
//     ValidationMiddleware.validate(updateStudentRequestStatusValidationSchema),
//     studentRequestController.updateStudentRequestStatus
// );

// // Delete a student request
// router.delete(
//     "/:id",
//     AuthMiddleware.verifyToken,
//     AuthMiddleware.authorize("courses", "manage_courses"),
//     studentRequestController.deleteStudentRequest
// );

export { router as studentRequestRouter };
