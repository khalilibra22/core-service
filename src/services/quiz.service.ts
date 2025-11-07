import { AppDataSource } from "../config/database";
import { logger } from "../utils/logger";
import { AnswerModel } from "../models/answer.model";
import { QuestionModel } from "../models/question.model";
import { QuizModel } from "../models/quiz.model";
import { QuizAttemptModel } from "../models/quiz-attempt.model";

export class QuizService {
  quizRepo: any;
  questionRepo: any;
  answerRepo: any;
  quizAttemptRepo: any;

  constructor() {
    this.quizRepo = AppDataSource.getRepository(QuizModel);
    this.questionRepo = AppDataSource.getRepository(QuestionModel);
    this.answerRepo = AppDataSource.getRepository(AnswerModel);
    this.quizAttemptRepo = AppDataSource.getRepository(QuizAttemptModel);
  }

  async createQuiz(quiz: QuizModel): Promise<QuizModel> {
    try {
      return await this.quizRepo.save(quiz);
    } catch (error) {
      logger.error({ err: error }, "createQuiz failed");
      throw new Error("Error creating quiz");
    }
  }

  async updateQuiz(quiz: QuizModel): Promise<void> {
    try {
      await this.quizRepo.save(quiz);
    } catch (error) {
      logger.error({ err: error }, "updateQuiz failed");
      throw new Error("Error updating quiz");
    }
  }

  async createQuestion(question: QuestionModel): Promise<QuestionModel> {
    try {
      return await this.questionRepo.save(question);
    } catch (error) {
      logger.error({ err: error }, "createQuestion failed");
      throw new Error("Error creating question");
    }
  }

  async updateQuestion(question: QuestionModel): Promise<void> {
    try {
      await this.questionRepo.save(question);
    } catch (error) {
      logger.error({ err: error }, "updateQuestion failed");
      throw new Error("Error updating question");
    }
  }

  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await this.questionRepo.softDelete(questionId);
    } catch (error) {
      logger.error({ err: error, questionId }, "deleteQuestion failed");
      throw new Error("Error deleting question");
    }
  }

  async createAnswer(answer: AnswerModel): Promise<AnswerModel> {
    try {
      return await this.answerRepo.save(answer);
    } catch (error) {
      logger.error({ err: error }, "createAnswer failed");
      throw new Error("Error creating answer");
    }
  }

  async createQuizAttempt(
    quizAttempt: QuizAttemptModel
  ): Promise<QuizAttemptModel> {
    try {
      return await this.quizAttemptRepo.save(quizAttempt);
    } catch (error) {
      logger.error({ err: error }, "createQuizAttempt failed");
      throw new Error("Error creating quiz attempt");
    }
  }

  async getQuizById(quizId: string): Promise<QuizModel | null> {
    try {
      return await this.quizRepo.findOne({
        where: { id: quizId },
        cache: {
          id: `quiz-${quizId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, quizId }, "getQuizById failed");
      throw new Error("Error fetching quiz by ID");
    }
  }

  async getQuizDetails(quizId: string): Promise<QuizModel | null> {
    try {
      return await this.quizRepo.findOne({
        where: { id: quizId },
        relations: ["questions"],
        cache: {
          id: `quiz-details-${quizId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, quizId }, "getQuizDetails failed");
      throw new Error("Error fetching quiz details");
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      await this.quizRepo.softDelete(quizId);
    } catch (error) {
      logger.error({ err: error, quizId }, "deleteQuiz failed");
      throw new Error("Error deleting quiz");
    }
  }

  async getQuestionById(questionId: string): Promise<QuestionModel | null> {
    try {
      return await this.questionRepo.findOne({
        where: { id: questionId },
        cache: {
          id: `question-${questionId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, questionId }, "getQuestionById failed");
      throw new Error("Error fetching question by ID");
    }
  }

  async getSessionQuizzes(sessionId: string): Promise<QuizModel[]> {
    try {
      return await this.quizRepo.find({
        where: { session: { id: sessionId } },
        relations: ["questions"],
        order: { order: "ASC" },
        cache: {
          id: `session-quizzes-${sessionId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, sessionId }, "getSessionQuizzes failed");
      throw new Error("Error fetching course quizzes");
    }
  }

  async getQuizOwner(quizId: string): Promise<string | null> {
    try {
      const quiz = await this.quizRepo.findOne({
        where: { id: quizId },
        relations: ["session", "session.course"],
        cache: {
          id: `quiz-owner-${quizId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
      return quiz?.session?.course?.ownerId ?? null;
    } catch (error) {
      logger.error({ err: error, quizId }, "getQuizOwner failed");
      throw new Error("Error fetching quiz owner");
    }
  }

  async getStudentAttemptCount(
    quizId: string,
    studentId: string
  ): Promise<number> {
    try {
      return await this.quizAttemptRepo.count({
        where: {
          quiz: { id: quizId },
          studentId: studentId,
        },
      });
    } catch (error) {
      logger.error(
        { err: error, quizId, studentId },
        "getStudentAttemptCount failed"
      );
      throw new Error("Error fetching student attempt count");
    }
  }

  async getStudentBestAttempt(
    quizId: string,
    studentId: string
  ): Promise<QuizAttemptModel | null> {
    try {
      const attempts = await this.quizAttemptRepo.find({
        where: {
          quiz: { id: quizId },
          studentId: studentId,
          isCompleted: true,
        },
        order: {
          score: "DESC",
          maxScore: "DESC",
        },
      });

      return attempts.length > 0 ? attempts[0] : null;
    } catch (error) {
      logger.error(
        { err: error, quizId, studentId },
        "getStudentBestAttempt failed"
      );
      throw new Error("Error fetching student best attempt");
    }
  }

  async updateQuizAttempt(
    quizAttempt: QuizAttemptModel
  ): Promise<QuizAttemptModel> {
    try {
      return await this.quizAttemptRepo.save(quizAttempt);
    } catch (error) {
      logger.error({ err: error }, "updateQuizAttempt failed");
      throw new Error("Error updating quiz attempt");
    }
  }

  async getQuizWithQuestions(quizId: string): Promise<QuizModel | null> {
    try {
      return await this.quizRepo.findOne({
        where: { id: quizId },
        relations: ["questions"],
        cache: {
          id: `quiz-with-questions-${quizId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, quizId }, "getQuizWithQuestions failed");
      throw new Error("Error fetching quiz with questions");
    }
  }
}
