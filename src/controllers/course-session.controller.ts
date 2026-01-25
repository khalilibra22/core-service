import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { CourseService } from "../services/course.service";
import { SessionService } from "../services/session.service";
import { MaterialService } from "../services/material.service";
import { plainToInstance } from "class-transformer";
import { LessonDto } from "../dtos/lesson.dto";
import { RecordedSessionDto } from "../dtos/recorded-session.dto";
import { SessionDto } from "../dtos/session.dto";
import { getCourseDto, getSessionDto } from "../utils";

@injectable()
export class CourseSessionController {
    constructor(
        @inject(CourseService) private courseService: CourseService,
        @inject(SessionService) private sessionService: SessionService,
        @inject(MaterialService) private materialService: MaterialService
    ) { }

    createCourseSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const course = await this.courseService.getCourseById(req.params.id);
            if (!course) {
                res.status(404).json({ error: "Course not found" });
                return;
            }
            if (course.ownerId !== req.body.ownerId) {
                res.status(403).json({ error: "You are not the owner of this course" });
                return;
            }
            if (course.type !== req.body.type) {
                res.status(400).json({ error: "Invalid session type" });
                return;
            }
            delete req.body.type;
            delete req.body.ownerId; // type and ownerId are not allowed to be updated
            const sessionBody = {
                ...req.body,
                course: course,
            };
            const session = await this.sessionService.createSession(sessionBody);
            const sessionDto = await getSessionDto(session, course.type ?? "session");
            res.status(201).json(sessionDto);
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id }, "createCourseSession failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    updateCourseSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const courseId = req.params.id;
            const sessionId = req.params.sessionId;

            const course = await this.courseService.getCourseById(courseId);
            if (!course) {
                res.status(404).json({ error: "Course not found" });
                return;
            }
            if (course.ownerId !== req.body.ownerId) {
                res.status(403).json({ error: "You are not the owner of this course" });
                return;
            }
            const session = await this.sessionService.getSessionById(sessionId);
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }

            delete req.body.type;
            delete req.body.ownerId; // type and ownerId are not allowed to be updated

            const sessionBody = {
                id: sessionId,
                ...session,
                ...req.body,
            };

            await this.sessionService.updateSession(sessionBody);
            res.status(200).json({ message: "Session updated successfully" });
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id, sessionId: req.params.sessionId }, "updateCourseSession failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    deleteCourseSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const courseId = req.params.id;
            const sessionId = req.params.sessionId;

            const course = await this.courseService.getCourseById(courseId);
            if (!course) {
                res.status(404).json({ error: "Course not found" });
                return;
            }
            if (course.ownerId !== req.body.ownerId) {
                res.status(403).json({ error: "You are not the owner of this course" });
                return;
            }
            const session = await this.sessionService.getSessionById(sessionId);
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }

            await this.sessionService.deleteSession(sessionId);
            res.status(204).json({ message: "Session deleted successfully" });
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id, sessionId: req.params.sessionId }, "deleteCourseSession failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getCourseSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const course = await this.courseService.getCourseById(id);
            if (!course) {
                res.status(404).json({ error: "Course not found" });
                return;
            }
            const sessions = await this.sessionService.getCourseSessions(id);
            const sessionDtos = await getSessionDto(sessions, course.type ?? "session");
            res.status(200).json(sessionDtos);
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id }, "getCourseSessions failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    createLesson = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = req.params.id;
            const session = await this.sessionService.getSessionById(sessionId);
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
            const lessonBody: any = {
                ...req.body,
                session: session,
            };

            // Validate materials if provided
            const ids = lessonBody.materials;
            // Remove materials from lessonBody to avoid TypeORM issues
            delete lessonBody.materials;
            const lesson = await this.courseService.createLesson(lessonBody);
            // Add materials via link table
            if (ids && lesson.id) {
                await this.materialService.addMaterialsToLesson(lesson.id, ids);
            }
            const lessonDto = plainToInstance(
                LessonDto,
                { ...lesson, materials: undefined },
                {
                    excludeExtraneousValues: true,
                }
            );
            res.status(201).json(lessonDto);
        } catch (error) {
            req.log.error({ err: error, sessionId: req.params.id }, "createLesson failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    updateLesson = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = req.params.id;
            const lessonId = req.params.lessonId;

            const session = await this.sessionService.getSessionById(sessionId);
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
            const lesson = await this.courseService.getLessonById(lessonId);
            if (!lesson) {
                res.status(404).json({ error: "Lesson not found" });
                return;
            }
            delete req.body.ownerId;
            const ids = req.body.materials;
            delete req.body.materials;
            const lessonBody = {
                ...lesson,
                ...req.body,
            };

            await this.courseService.updateLesson(lessonBody);
            if (ids && lesson.id) {
                await this.materialService.updateLessonMaterials(lesson.id, ids);
            }

            res.status(200).json({ message: "Lesson updated successfully" });
        } catch (error) {
            req.log.error({ err: error, sessionId: req.params.id, lessonId: req.params.lessonId }, "updateLesson failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    deleteLesson = async (req: Request, res: Response): Promise<void> => {
        try {
            const sessionId = req.params.id;
            const lessonId = req.params.lessonId;

            const session = await this.sessionService.getSessionById(sessionId);
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
            const lesson = await this.courseService.getLessonById(lessonId);
            if (!lesson) {
                res.status(404).json({ error: "Lesson not found" });
                return;
            }

            await this.courseService.deleteLesson(lessonId);
            res.status(204).send();
        } catch (error) {
            req.log.error({ err: error, sessionId: req.params.id, lessonId: req.params.lessonId }, "deleteLesson failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getLessonsBySessionId = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const sessionId = req.params.id;
            const session = await this.sessionService.getSessionById(sessionId);
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }
            const lessons = await this.courseService.getLessonsBySessionId(sessionId);

            // Transform materialLinks to materials for DTO
            const shapedLessons = lessons.map((l: any) => ({
                ...l,
                // Keep MaterialLink objects so MaterialDto can read obj.material.* and flags
                materials: (l.materialLinks ?? []).filter((link: any) => link?.material),
            }));

            const lessonDtos = plainToInstance(LessonDto, shapedLessons, {
                excludeExtraneousValues: true,
            });
            res.status(200).json(lessonDtos);
        } catch (error) {
            req.log.error({ err: error, sessionId: req.params.id }, "getLessonsBySessionId failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getPrerecordedSessionDetails = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const sessionId = req.params.id;
            const sessionDetails =
                await this.sessionService.getPrerecordedSessionDetails(sessionId);
            if (!sessionDetails) {
                res.status(404).json({ error: "Session not found" });
                return;
            }

            if (sessionDetails.course?.type !== "prerecorded") {
                res.status(400).json({ error: "Session is not a prerecorded session" });
                return;
            }

            // Transform materialLinks to materials for DTO
            const shapedSession = {
                ...sessionDetails,
                lessons: sessionDetails.lessons?.map((l: any) => ({
                    ...l,
                    materials: (l.materialLinks ?? []).filter((link: any) => link?.material),
                })),
            };

            const sessionDto = plainToInstance(RecordedSessionDto, shapedSession, {
                excludeExtraneousValues: true,
            });

            res.status(200).json(sessionDto);
        } catch (error) {
            req.log.error({ err: error, sessionId: req.params.id }, "getPrerecordedSessionDetails failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getPrerecordedCourseSections = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const courseId = req.params.id;
            const course = await this.courseService.getCourseById(courseId);

            if (!course) {
                res.status(404).json({ error: "Course not found" });
                return;
            }

            if (course.type !== "prerecorded") {
                res.status(400).json({ error: "Course is not a prerecorded course" });
                return;
            }

            // Record view for authenticated users
            const studentId = req.body.ownerId ?? res.locals.ownerId;
            if (studentId) {
                const isPaid = course.couresSettings?.isPaid === true;
                const isFree = course.couresSettings?.isPaid === false;

                // Get current view count once
                const userViewCount = await this.courseService.getUserCourseViewCount(courseId, studentId);
                // Check view limit based on course type
                if (isFree && userViewCount >= 4) {
                    res.status(403).json({
                        error: "You have reached the maximum number of views (4) for this free course",
                        viewsCount: userViewCount
                    });
                    return;
                }

                if (isPaid && userViewCount >= 16) {
                    res.status(403).json({
                        error: "You have reached the maximum number of views (16) for this paid course",
                        viewsCount: userViewCount
                    });
                    return;
                }

                // Record the view (wrapped in try-catch to not fail the request if recording fails)
                try {
                    await this.courseService.createCourseView(course, studentId);
                } catch (viewError) {
                    // Log but don't fail the request if view recording fails
                    req.log.warn({ err: viewError, courseId, studentId }, "Failed to record course view");
                }
            }

            const sections = await this.sessionService.getPrerecordedCourseSections(
                courseId
            );

            // Transform materialLinks to materials for DTO
            const shapedSections = sections.map(session => ({
                ...session,
                lessons: session.lessons?.map((l: any) => ({
                    ...l,
                    materials: (l.materialLinks ?? []).filter((link: any) => link?.material),
                })),
            }));

            const sectionDtos = plainToInstance(RecordedSessionDto, shapedSections, {
                excludeExtraneousValues: true,
            });
            res.status(200).json(sectionDtos);
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id }, "getPrerecordedCourseSections failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getOneOnOneSessionsByTeacherId = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const teacherId = req.params.teacherId;
            if (teacherId !== req.body.ownerId) {
                res.status(403).json({ error: "You are not the owner of this course" });
                return;
            }
            const sessions = await this.sessionService.getTeacherOneOnOneSessions(
                teacherId
            );
            const sessionDtos = plainToInstance(SessionDto, sessions, {
                excludeExtraneousValues: true,
            });
            res.status(200).json(sessionDtos);
        } catch (error) {
            req.log.error({ err: error, teacherId: req.params.teacherId }, "getOneOnOneSessionsByTeacherId failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
}
