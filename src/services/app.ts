import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { courseRouter } from "../routes/course.routes";
import { feedbackRouter } from "../routes/feedback.routes";
import { sessionTimeRequestRouter } from "../routes/session-time-request.routes";
import { enrollmentRouter } from "../routes/enrollment.routes";
import { settingRouter } from "../routes/setting.routes";
import { quizRouter } from "../routes/quiz.routes";
import { sessionRouter } from "../routes/session.routes";
import { virtualClassroomRouter } from "../routes/virtualClassroom.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());

app.use(express.json());

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && err.name === "SyntaxError") {
    // JSON parsing error
    res.status(400).json({ error: "Invalid JSON" });
  }
  next(err); // Forward the error if it's not a JSON parsing error
});

app.use("/courses", courseRouter);
app.use("/feedbacks", feedbackRouter);
app.use("/session-time-requests", sessionTimeRequestRouter);
app.use("/enrollments", enrollmentRouter);
app.use("/settings", settingRouter);
app.use("/quizzes", quizRouter);
app.use("/sessions", sessionRouter);

app.use("/virtual-classrooms", virtualClassroomRouter);

app.get("/", async (req: Request, res: Response) => {
  res.send("running !");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

export default app;
