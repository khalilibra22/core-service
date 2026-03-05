import express from "express";
import { courseRouter } from "../routes/v1/course.routes";
import { enrollmentRouter } from "../routes/v1/enrollment.routes";
import { feedbackRouter } from "../routes/v1/feedback.routes";
import { quizRouter } from "../routes/v1/quiz.routes";
import { sessionTimeRequestRouter } from "../routes/v1/session-time-request.routes";
import { sessionRouter } from "../routes/v1/session.routes";
import { settingRouter } from "../routes/v1/setting.routes";
import { storageRouter } from "../routes/v1/storage.routes";
import { notificationRouter } from "../routes/v1/notification.routes";
import { studentRequestRouter } from "../routes/v1/student-request.routes";
import { paymentRouter } from "../routes/v1/payment.routes";
import { inboundCourseRouter } from "../routes/v1/inbound-course.routes";

const app = express.Router();

const requireInboundKey = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
): void => {
    const INBOUND_API_KEY = process.env.INBOUND_API_KEY;

    if (!INBOUND_API_KEY) {
        res.status(503).json({ message: "Inbound endpoint not configured" });
        return;
    }
    const provided = req.headers["x-internal-api-key"];

    if (provided !== INBOUND_API_KEY) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    next();
};

app.use("/courses", courseRouter);
app.use("/feedbacks", feedbackRouter);
app.use("/session-time-requests", sessionTimeRequestRouter);
app.use("/enrollments", enrollmentRouter);
app.use("/settings", settingRouter);
app.use("/quizzes", quizRouter);
app.use("/sessions", sessionRouter);
app.use("/uploads", storageRouter);
app.use("/notifications", notificationRouter);
app.use("/student-requests", studentRequestRouter);
app.use("/payments", requireInboundKey, paymentRouter);
// Internal-only course count for subscription quota checks (called by user-service)
app.use("/inbounds/courses", requireInboundKey, inboundCourseRouter);

export { app as appV1 };
