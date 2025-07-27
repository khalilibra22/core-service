import { AppDataSource } from "../config/database";
import { AnswerModel } from "../models/answer.model";
import { QuestionModel } from "../models/question.model";
import { QuizModel } from "../models/quiz.model";
import { QuizAttemptModel } from "../models/quizAttempt.model";

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

  async createQuestion(question: QuestionModel): Promise<QuestionModel> {
    try {
      return await this.questionRepo.save(question);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating question");
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
}
