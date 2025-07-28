import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { QuizService } from "../services/quiz.service";
import { plainToInstance } from "class-transformer";
import { QuizDto } from "../dtos/quiz.dto";
import { QuestionDto } from "../dtos/question.dto";

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
      const quizDto = plainToInstance(QuizDto, quiz, {
        excludeExtraneousValues: true,
      });

      res.status(201).json(quizDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id, quizId } = req.params;
      const updates = req.body;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const quiz = await this.quizService.getQuizById(quizId);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      // Remove ownerId from updates if present
      delete updates.ownerId;
      await this.quizService.updateQuiz({ ...quiz, ...updates });
      res.status(200).json({ message: "Quiz updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id, quizId } = req.params;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const quiz = await this.quizService.getQuizById(quizId);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      await this.quizService.deleteQuiz(quizId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await this.quizService.getQuizById(id);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      delete req.body.ownerId;
      const questionBody = {
        ...req.body,
        quiz: quiz,
      };
      const question = await this.quizService.createQuestion(questionBody);
      const questionDto = plainToInstance(QuestionDto, question, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(questionDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id, questionId } = req.params;
      const updates = req.body;
      const quiz = await this.quizService.getQuizById(id);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      const question = await this.quizService.getQuestionById(questionId);
      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }
      // Remove ownerId from updates if present
      delete updates.ownerId;
      await this.quizService.updateQuestion({ ...question, ...updates });
      res.status(200).json({ message: "Question updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id, questionId } = req.params;
      const quiz = await this.quizService.getQuizById(id);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      const question = await this.quizService.getQuestionById(questionId);
      if (!question) {
        res.status(404).json({ error: "Question not found" });
        return;
      }
      await this.quizService.deleteQuestion(questionId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getCourseQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const quizzes = await this.quizService.getCourseQuizzes(id);

      const quizDtos = plainToInstance(QuizDto, quizzes, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(quizDtos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
