import "reflect-metadata";
import { container } from "tsyringe";
import { AppDataSource } from "./config/database";
import { CourseModel } from "./models/course.model";
import { CourseSettingsModel } from "./models/course-settings.model";
import { SessionModel } from "./models/session.model";
import { CertificateModel } from "./models/certificate.model";
import { LessonModel } from "./models/lesson.model";
import { MaterialModel } from "./models/material.model";
import { MaterialLinkModel } from "./models/material-link.model";
import { CourseViewModel } from "./models/course-view.model";
import { CourseProgressModel } from "./models/course-progress.model";
import { StudentRequestModel } from "./models/student-request.model";
import { EnrollmentModel } from "./models/enrollment.model";
import { ReviewModel } from "./models/review.model";
import { ComplaintModel } from "./models/complaint.model";
import { QuizModel } from "./models/quiz.model";
import { QuestionModel } from "./models/question.model";
import { AnswerModel } from "./models/answer.model";
import { QuizAttemptModel } from "./models/quiz-attempt.model";
import { SessionTimeChangeRequestModel } from "./models/session-time-change-request.model";
import { BigBlueButtonService } from "./services/big-blue-button.service";
import { SettingsModel } from "./models/settings.model";

// Register Repositories
container.register("CourseRepository", {
    useValue: AppDataSource.getRepository(CourseModel),
});
container.register("CourseSettingsRepository", {
    useValue: AppDataSource.getRepository(CourseSettingsModel),
});
container.register("SessionRepository", {
    useValue: AppDataSource.getRepository(SessionModel),
});
container.register("CertificateRepository", {
    useValue: AppDataSource.getRepository(CertificateModel),
});
container.register("LessonRepository", {
    useValue: AppDataSource.getRepository(LessonModel),
});
container.register("MaterialRepository", {
    useValue: AppDataSource.getRepository(MaterialModel),
});
container.register("MaterialLinkRepository", {
    useValue: AppDataSource.getRepository(MaterialLinkModel),
});
container.register("CourseViewRepository", {
    useValue: AppDataSource.getRepository(CourseViewModel),
});
container.register("CourseProgressRepository", {
    useValue: AppDataSource.getRepository(CourseProgressModel),
});
container.register("StudentRequestRepository", {
    useValue: AppDataSource.getRepository(StudentRequestModel),
});
container.register("EnrollmentRepository", {
    useValue: AppDataSource.getRepository(EnrollmentModel),
});
container.register("ReviewRepository", {
    useValue: AppDataSource.getRepository(ReviewModel),
});
container.register("ComplaintRepository", {
    useValue: AppDataSource.getRepository(ComplaintModel),
});
container.register("QuizRepository", {
    useValue: AppDataSource.getRepository(QuizModel),
});
container.register("QuestionRepository", {
    useValue: AppDataSource.getRepository(QuestionModel),
});
container.register("AnswerRepository", {
    useValue: AppDataSource.getRepository(AnswerModel),
});
container.register("QuizAttemptRepository", {
    useValue: AppDataSource.getRepository(QuizAttemptModel),
});
container.register("SessionTimeRequestRepository", {
    useValue: AppDataSource.getRepository(SessionTimeChangeRequestModel),
});

container.register("SettingRepository", {
    useValue: AppDataSource.getRepository(SettingsModel),
});


container.registerSingleton("VirtualClassroomService", BigBlueButtonService);

export { container };
