import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { QuizService } from "../services/quiz.service";

export class QuizController {
  private quizService: QuizService;
  private courseService: CoursService;
  constructor() {
    this.quizService = new QuizService();
    this.courseService = new CoursService();
  }

  async createQuiz(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      delete req.body.ownerId;
      const quizBody = {
        ...req.body,
        course: course,
      };
      const quiz = await this.quizService.createQuiz(quizBody);

      res.status(201).json(quiz);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
