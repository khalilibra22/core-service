import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { CourseService } from "../services/course.service";
import { QuizService } from "../services/quiz.service";
import { SessionService } from "../services/session.service";
import { plainToInstance } from "class-transformer";
import { QuizDto } from "../dtos/quiz.dto";
import { QuestionDto } from "../dtos/question.dto";
import { QuizAttemptDto } from "../dtos/quiz-attempt.dto";

@injectable()
export class QuizController {
  constructor(
    @inject(QuizService) private quizService: QuizService,
    @inject(CourseService) private courseService: CourseService,
    @inject(SessionService) private sessionService: SessionService
  ) { }

  createQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await this.sessionService.getSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (
        !session.course?.ownerId ||
        session.course?.ownerId !== req.body.ownerId
      ) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      delete req.body.ownerId;
      const quizBody = {
        ...req.body,
        session: session,
      };
      const quiz = await this.quizService.createQuiz(quizBody);
      const quizDto = plainToInstance(QuizDto, quiz, {
        excludeExtraneousValues: true,
      });

      res.status(201).json(quizDto);
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id }, "createQuiz failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, quizId } = req.params;
      const updates = req.body;
      const session = await this.sessionService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (
        !session.course?.ownerId ||
        session.course?.ownerId !== req.body.ownerId
      ) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      req.log.error({ err: error, sessionId: req.params.id, quizId: req.params.quizId }, "updateQuiz failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, quizId } = req.params;
      const session = await this.sessionService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (
        !session.course?.ownerId ||
        session.course?.ownerId !== req.body.ownerId
      ) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      req.log.error({ err: error, sessionId: req.params.id, quizId: req.params.quizId }, "deleteQuiz failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const quiz = await this.quizService.getQuizById(id);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      // Check if the requester is the owner of the course
      const ownerId = await this.quizService.getQuizOwner(id);
      if (!ownerId || ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      req.log.error({ err: error, quizId: req.params.id }, "createQuestion failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, questionId } = req.params;
      const updates = req.body;
      const quiz = await this.quizService.getQuizById(id);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      const ownerId = await this.quizService.getQuizOwner(id);
      if (!ownerId || ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      req.log.error({ err: error, quizId: req.params.id, questionId: req.params.questionId }, "updateQuestion failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, questionId } = req.params;
      const quiz = await this.quizService.getQuizById(id);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }
      const ownerId = await this.quizService.getQuizOwner(id);
      if (!ownerId || ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      req.log.error({ err: error, quizId: req.params.id, questionId: req.params.questionId }, "deleteQuestion failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getSessionQuizzes = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const userRole = req.body.userRole;
      const session = await this.sessionService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      const quizzes = await this.quizService.getSessionQuizzes(id);
      const quizDtos = plainToInstance(QuizDto, quizzes, {
        excludeExtraneousValues: true,
        groups: userRole === 2 ? [] : ["instructor", "admin"],
      });
      res.status(200).json(quizDtos);
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id }, "getSessionQuizzes failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getQuizDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const quizId = req.params.id;
      const userRole = req.body.userRole;
      const quiz = await this.quizService.getQuizDetails(quizId);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      // Determine transformation groups based on user role
      const groups = userRole === 2 ? [] : ["instructor", "admin"];

      const quizDto = plainToInstance(QuizDto, quiz, {
        excludeExtraneousValues: true,
        groups: groups,
      });

      res.status(200).json(quizDto);
    } catch (error) {
      req.log.error({ err: error, quizId: req.params.id }, "getQuizDetails failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  submitQuizAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      const quizId = req.params.id;
      const studentId = req.body.ownerId;
      const { answers, timeTaken } = req.body;

      // Get quiz with questions
      const quiz = await this.quizService.getQuizWithQuestions(quizId);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      // Check if quiz is active
      if (!quiz.isActive) {
        res.status(400).json({ error: "Quiz is not active" });
        return;
      }

      // Check attempt count
      const attemptCount = await this.quizService.getStudentAttemptCount(
        quizId,
        studentId
      );
      if (attemptCount >= (quiz.maxAttempts || 3)) {
        res.status(400).json({
          error: `Maximum attempts (${quiz.maxAttempts || 3}) reached for this quiz`,
        });
        return;
      }

      // Calculate score
      let score = 0;
      let maxScore = 0;
      const questions = quiz.questions || [];

      for (const question of questions) {
        maxScore += question.points || 0;
        const studentAnswer = answers.find(
          (a: any) => a.questionId === question.id
        );
        if (studentAnswer && studentAnswer.answer === question.answer) {
          score += question.points || 0;
        }
      }

      // Create quiz attempt
      const quizAttempt = await this.quizService.createQuizAttempt({
        studentId,
        quiz: { id: quizId } as any,
        score,
        maxScore,
        timeTaken: timeTaken || null,
        isCompleted: true,
      });

      const attemptDto = plainToInstance(QuizAttemptDto, quizAttempt, {
        excludeExtraneousValues: true,
      });

      res.status(201).json(attemptDto);
    } catch (error) {
      req.log.error(
        { err: error, quizId: req.params.id },
        "submitQuizAttempt failed"
      );
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getBestAttempt = async (req: Request, res: Response): Promise<void> => {
    try {
      const quizId = req.params.id;
      const studentId = req.body.ownerId;
      console.log("studentId", studentId);

      const quiz = await this.quizService.getQuizById(quizId);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found" });
        return;
      }

      const bestAttempt = await this.quizService.getStudentBestAttempt(
        quizId,
        studentId
      );

      if (!bestAttempt) {
        res.status(404).json({ error: "No completed attempts found" });
        return;
      }

      const attemptDto = plainToInstance(QuizAttemptDto, bestAttempt, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(attemptDto);
    } catch (error) {
      req.log.error(
        { err: error, quizId: req.params.id },
        "getBestAttempt failed"
      );
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
