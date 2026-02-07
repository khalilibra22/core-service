import "reflect-metadata";
import { container, Lifecycle } from "tsyringe";
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
import { FeedbackService } from "./services/feedback.service";
import { DtoService } from "./services/dto.service";
import { CourseService } from "./services/course.service";
import { EnrollmentService } from "./services/enrollment.service";
import { SessionService } from "./services/session.service";
import { MaterialService } from "./services/material.service";
import { NotificationService } from "./services/notification.service";
import { HttpService } from "./services/http.service";
import { StudentRequestService } from "./services/student-request.service";
import { QuizService } from "./services/quiz.service";
import { EnrollmentOrchestratorService } from "./services/enrollment-orchestrator.service";

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

// Register Services explicitly to help with discovery and avoid some tsyringe issues
container.register(FeedbackService, { useClass: FeedbackService }, { lifecycle: Lifecycle.Singleton });
container.register(DtoService, { useClass: DtoService }, { lifecycle: Lifecycle.Singleton });
container.register(CourseService, { useClass: CourseService }, { lifecycle: Lifecycle.Singleton });
container.register(EnrollmentService, { useClass: EnrollmentService }, { lifecycle: Lifecycle.Singleton });
container.register(SessionService, { useClass: SessionService }, { lifecycle: Lifecycle.Singleton });
container.register(MaterialService, { useClass: MaterialService }, { lifecycle: Lifecycle.Singleton });
container.register(NotificationService, { useClass: NotificationService }, { lifecycle: Lifecycle.Singleton });
container.register(HttpService, { useClass: HttpService }, { lifecycle: Lifecycle.Singleton });
container.register(StudentRequestService, { useClass: StudentRequestService }, { lifecycle: Lifecycle.Singleton });
container.register(QuizService, { useClass: QuizService }, { lifecycle: Lifecycle.Singleton });
container.register(EnrollmentOrchestratorService, { useClass: EnrollmentOrchestratorService }, { lifecycle: Lifecycle.Singleton });

export { container };
