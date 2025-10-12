import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { plainToInstance } from "class-transformer";
import { CourseSettingsModel } from "../models/course-settings.model";
import { CourseModel } from "../models/course.model";
import { MinimalCourseDto } from "../dtos/minimal-course.dto";
import { getCourseDto, getSessionDto } from "../utils";
import { CertificateDto } from "../dtos/certificate.dto";
import { LessonDto } from "../dtos/lesson.dto";
import { RecordedSessionDto } from "../dtos/recorded-session.dto";
import { SessionDto } from "../dtos/session.dto";
import { MaterialDto } from "../dtos/material.dto";

export class CourseController {
  private courseService: CourseService;
  constructor() {
    this.courseService = new CourseService();
  }

  createDraftCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseSettings = await this.courseService.createCourseSettings({});
      const courseSettingsBody = {
        ...req.body,
        couresSettings: courseSettings,
      };
      const course = await this.courseService.createCourse(courseSettingsBody);
      const minimalCourseDto = plainToInstance(MinimalCourseDto, course, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(minimalCourseDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
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
        res.status(400).json({ error: "Course type cannot be changed" });
        return;
      }
      const courseSettingsFromBody = plainToInstance(
        CourseSettingsModel,
        req.body,
        {
          excludeExtraneousValues: false,
        }
      );
      delete req.body.ownerId; // ownerId is not allowed to be updated
      const courseFromBody = plainToInstance(CourseModel, req.body, {
        excludeExtraneousValues: false,
      });

      const courseBody = {
        id: id,
        ...course,
        ...courseFromBody,
        couresSettings: { ...course.couresSettings, ...courseSettingsFromBody },
        status: "published",
      };
      await this.courseService.updateCourse(courseBody);
      res.status(200).json({ message: "Course updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateDraftCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      if (course.status !== "draft") {
        res.status(409).json({ error: "Course is not in draft status" });
        return;
      }
      if (course.type !== req.body.type) {
        res.status(400).json({ error: "Course type cannot be changed" });
        return;
      }
      const courseSettingsFromBody = plainToInstance(
        CourseSettingsModel,
        req.body,
        {
          excludeExtraneousValues: false,
        }
      );
      delete req.body.ownerId; // ownerId is not allowed to be updated
      const courseFromBody = plainToInstance(CourseModel, req.body, {
        excludeExtraneousValues: false,
      });

      const courseBody = {
        id: id,
        ...course,
        ...courseFromBody,
        couresSettings: { ...course.couresSettings, ...courseSettingsFromBody },
      };
      await this.courseService.updateCourse(courseBody);
      res.status(200).json({ message: "Course updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

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
      delete req.body.type, req.body.ownerId; // type and ownerId are not allowed to be updated
      const sessionBody = {
        ...req.body,
        course: course,
      };
      const session = await this.courseService.createCourseSession(sessionBody);
      const sessionDto = getSessionDto(session, course.type ?? "session");
      res.status(201).json(sessionDto);
    } catch (error) {
      console.log(error);
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
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      delete req.body.type, req.body.ownerId; // type and ownerId are not allowed to be updated

      const sessionBody = {
        id: sessionId,
        ...session,
        ...req.body,
      };

      await this.courseService.updateSession(sessionBody);
      res.status(200).json({ message: "Session updated successfully" });
    } catch (error) {
      console.log(error);
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
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      await this.courseService.deleteSession(sessionId);
      res.status(204).json({ message: "Session deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // create a certificate
  createCertificate = async (req: Request, res: Response): Promise<void> => {
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
      delete req.body.ownerId;
      const certificateBody = {
        ...req.body,
        course: course,
      };
      const certificate = await this.courseService.createCertificate(
        certificateBody
      );

      const certificateDto = plainToInstance(CertificateDto, certificate, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(certificateDto);
    } catch (error) {
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
      const sessions = await this.courseService.getCourseSessions(id);
      const sessionDtos = getSessionDto(sessions, course.type ?? "session");
      res.status(200).json(sessionDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // cancel course
  cancelCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      // TODO: check if user is allowed to cancel the course
      // TODO: check if course is already canceled
      // TODO: check if its canceled by the instructor or student
      // TODO: 50% if it's canceled by the student and 100% if it's canceled by the instructor
      //cancelation is only allowed if the course is not started yet and up to 48 hours before the course starts

      if (course.couresSettings) {
        course.couresSettings.isCanceled = true;
        course.couresSettings.reasonOfCancellation =
          req.body.reasonOfCancellation;
        course.couresSettings.canceledBy = req.body.ownerId;
      }
      course.status = "canceled";
      await this.courseService.updateCourse(course);

      res.status(200).json({ message: "Course canceled successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseByIdNoCache(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const courseDto = getCourseDto(course, course.type ?? "minimal");
      res.status(200).json(courseDto);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get teachers by courses by teacher id
  getCoursesByTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const courseType = req.query.type as string;
      const courseTypeList = ["group", "live", "prerecorded"];
      if (!courseTypeList.includes(courseType)) {
        res.status(400).json({ error: "Invalid course type" });
        return;
      }
      const courses = await this.courseService.getCoursesByTeacherId(
        id,
        courseType
      );
      const courseDtos = getCourseDto(courses, courseType);
      res.status(200).json(courseDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get all courses of type live using pagination
  getAllLiveCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await this.courseService.getAllLiveCourses(page, limit);
      const courseDtos = getCourseDto(courses, "live");
      res.status(200).json(courseDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllGroupCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await this.courseService.getAllGroupCourses(page, limit);
      const courseDtos = getCourseDto(courses, "group");
      res.status(200).json(courseDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get all courses of type prerecorded using pagination
  getAllPrerecordedCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await this.courseService.getAllPrerecordedCourses(
        page,
        limit
      );
      const courseDtos = getCourseDto(courses, "prerecorded");
      res.status(200).json(courseDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      await this.courseService.deleteCourse(id);
      res.status(204).send();
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createLesson = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const session = await this.courseService.getSessionById(sessionId);
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
        await this.courseService.addMaterialsToLesson(lesson.id, ids);
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
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateLesson = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;

      const session = await this.courseService.getSessionById(sessionId);
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
      // update materials

      delete lessonBody.materials;
      await this.courseService.updateLesson(lessonBody);
      if (ids && lesson.id) {
        await this.courseService.updateLessonMaterials(lesson.id, ids);
      }

      res.status(200).json({ message: "Lesson updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteLesson = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;

      const session = await this.courseService.getSessionById(sessionId);
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
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getLessonsBySessionId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const session = await this.courseService.getSessionById(sessionId);
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
      console.log(error);
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
        await this.courseService.getPrerecordedSessionDetails(sessionId);
      if (!sessionDetails) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (sessionDetails.course?.type !== "prerecorded") {
        res.status(400).json({ error: "Session is not a prerecorded session" });
        return;
      }
      const sessionDto = plainToInstance(RecordedSessionDto, sessionDetails, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(sessionDto);
    } catch (error) {
      console.log(error);
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
      const sections = await this.courseService.getPrerecordedCourseSections(
        courseId
      );
      const sectionDtos = plainToInstance(RecordedSessionDto, sections, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(sectionDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //search courses by its type using pagination
  searchCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseType = req.query.type as string;
      const courseTypeList = ["group", "live", "prerecorded"];
      if (!courseTypeList.includes(courseType)) {
        res.status(400).json({ error: "Invalid course type" });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await this.courseService.searchCourses(
        courseType,
        page,
        limit
      );
      const courseDtos = getCourseDto(courses, courseType);
      res.status(200).json(courseDtos);
    } catch (error) {
      console.log(error);
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
      const sessions = await this.courseService.getTeacherOneOnOneSessions(
        teacherId
      );
      const sessionDtos = plainToInstance(SessionDto, sessions, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(sessionDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  addCourseMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const course = await this.courseService.getCourseById(courseId);

      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const ids = req.body.materials;
      await this.courseService.addMaterialsToCourse(courseId, ids);
      res.status(200).json({ message: "Materials added successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const materials = await this.courseService.getCourseMaterials(courseId);
      const materialDtos = plainToInstance(MaterialDto, materials, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(materialDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // get lesson materials
  getLessonMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const {lessonId} = req.params;
      const materials = await this.courseService.getLessonMaterials(lessonId);
      const materialDtos = plainToInstance(MaterialDto, materials, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(materialDtos);
    }
    catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // remove lesson materials
  removeLessonMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const {lessonId, id} = req.params;
      const session = await this.courseService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const {materialIds} = req.body;
      await this.courseService.removeMaterialsFromLesson(lessonId, materialIds);
      res.status(200).json({ message: "Materials removed successfully" });
    }
    catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // remove course materials
  removeCourseMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const {id} = req.params;
      const {materialIds} = req.body;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      await this.courseService.removeMaterialsFromCourse(id, materialIds);
      res.status(200).json({ message: "Materials removed successfully" });
    }
    catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ALL course materials
  toggleCourseMaterialsShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const isSharableInput = req.body?.isSharable;
      const isSharable = isSharableInput === true || isSharableInput === "true" || isSharableInput === 1 || isSharableInput === "1";
      await this.courseService.setCourseMaterialsSharable(courseId, isSharable);
      res.status(200).json({ message: `Course materials ${isSharable ? "shared" : "unshared"} successfully` });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ONE course material (auto-toggle)
  toggleCourseMaterialShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const materialId = req.params.materialId;
      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const newValue = await this.courseService.toggleCourseMaterialSharable(courseId, materialId);
      res.status(200).json({ 
        message: `Course material ${newValue ? "shared" : "unshared"} successfully`,
        isSharable: newValue
      });
    } catch (error: any) {
      if (error.message.includes("Material link not found")) {
        res.status(404).json({ error: "Material link not found" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ALL lesson materials (under a session)
  toggleLessonMaterialsShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const isSharableInput = req.body?.isSharable;
      const isSharable = isSharableInput === true || isSharableInput === "true" || isSharableInput === 1 || isSharableInput === "1";
      await this.courseService.setLessonMaterialsSharable(lessonId, isSharable);
      res.status(200).json({ message: `Lesson materials ${isSharable ? "shared" : "unshared"} successfully` });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ONE lesson material (auto-toggle)
  toggleLessonMaterialShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;
      const materialId = req.params.materialId;
      
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const materialLink = await this.courseService.getMaterialLinkByMaterialIdAndLessonId(materialId, lessonId);
      if (!materialLink) {
        res.status(404).json({ error: "Material link not found" });
        return;
      }
      materialLink.isSharable = !materialLink.isSharable;
      await this.courseService.updateMaterialLinkById(materialLink);
      const newValue = materialLink.isSharable;
      res.status(200).json({ 
        message: `Lesson material ${newValue ? "shared" : "unshared"} successfully`,
        isSharable: newValue
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
