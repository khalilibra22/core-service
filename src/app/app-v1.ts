import express from "express";
import { courseRouter } from "../routes/v1/course.routes";
import { enrollmentRouter } from "../routes/v1/enrollment.routes";
import { feedbackRouter } from "../routes/v1/feedback.routes";
import { quizRouter } from "../routes/v1/quiz.routes";
import { sessionTimeRequestRouter } from "../routes/v1/session-time-request.routes";
import { sessionRouter } from "../routes/v1/session.routes";
import { settingRouter } from "../routes/v1/setting.routes";
import { storageRouter } from "../routes/v1/storage.routes";

const app = express.Router();

app.use("/courses", courseRouter);
app.use("/feedbacks", feedbackRouter);
app.use("/session-time-requests", sessionTimeRequestRouter);
app.use("/enrollments", enrollmentRouter);
app.use("/settings", settingRouter);
app.use("/quizzes", quizRouter);
app.use("/sessions", sessionRouter);
app.use("/uploads", storageRouter);

export { app as appV1 };
