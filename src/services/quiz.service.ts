import { AppDataSource } from "../config/database";
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
      console.error(error);
      throw new Error("Error creating quiz");
    }
  }

  async updateQuiz(quiz: QuizModel): Promise<void> {
    try {
      await this.quizRepo.save(quiz);
    } catch (error) {
      console.error(error);
      throw new Error("Error updating quiz");
    }
  }

  async createQuestion(question: QuestionModel): Promise<QuestionModel> {
    try {
      return await this.questionRepo.save(question);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating question");
    }
  }

  async updateQuestion(question: QuestionModel): Promise<void> {
    try {
      await this.questionRepo.save(question);
    } catch (error) {
      console.error(error);
      throw new Error("Error updating question");
    }
  }

  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await this.questionRepo.softDelete(questionId);
    } catch (error) {
      console.error(error);
      throw new Error("Error deleting question");
    }
  }

  async createAnswer(answer: AnswerModel): Promise<AnswerModel> {
    try {
      return await this.answerRepo.save(answer);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating answer");
    }
  }

  async createQuizAttempt(
    quizAttempt: QuizAttemptModel
  ): Promise<QuizAttemptModel> {
    try {
      return await this.quizAttemptRepo.save(quizAttempt);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating quiz attempt");
    }
  }

  async getQuizById(quizId: string): Promise<QuizModel | null> {
    try {
      return await this.quizRepo.findOneBy({ id: quizId }, {
        cache: {
          id: `quiz-${quizId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      console.error(error);
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
      console.error(error);
      throw new Error("Error fetching quiz details");
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      await this.quizRepo.softDelete(quizId);
    } catch (error) {
      console.error(error);
      throw new Error("Error deleting quiz");
    }
  }

  async getQuestionById(questionId: string): Promise<QuestionModel | null> {
    try {
      return await this.questionRepo.findOneBy({ id: questionId }, {
        cache: {
          id: `question-${questionId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      throw new Error("Error fetching quiz owner");
    }
  }
}
