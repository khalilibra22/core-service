import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { CourseService } from "../services/course.service";
import { MaterialService } from "../services/material.service";
import { SessionService } from "../services/session.service";
import { plainToInstance } from "class-transformer";
import { MaterialDto } from "../dtos/material.dto";

@injectable()
export class CourseMaterialController {
    constructor(
        @inject(CourseService) private courseService: CourseService,
        @inject(MaterialService) private materialService: MaterialService,
        @inject(SessionService) private sessionService: SessionService
    ) { }

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
            await this.materialService.addMaterialsToCourse(courseId, ids);
            res.status(200).json({ message: "Materials added successfully" });
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id }, "addCourseMaterials failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getCourseMaterials = async (req: Request, res: Response): Promise<void> => {
        try {
            const courseId = req.params.id;
            const materials = await this.materialService.getCourseMaterials(courseId);
            const materialDtos = plainToInstance(MaterialDto, materials, {
                excludeExtraneousValues: true,
            });
            res.status(200).json(materialDtos);
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id }, "getCourseMaterials failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    // get lesson materials
    getLessonMaterials = async (req: Request, res: Response): Promise<void> => {
        try {
            const { lessonId } = req.params;
            const materials = await this.materialService.getLessonMaterials(lessonId);
            const materialDtos = plainToInstance(MaterialDto, materials, {
                excludeExtraneousValues: true,
            });
            res.status(200).json(materialDtos);
        }
        catch (error) {
            req.log.error({ err: error, lessonId: req.params.lessonId }, "getLessonMaterials failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    // remove lesson materials
    removeLessonMaterials = async (req: Request, res: Response): Promise<void> => {
        try {
            const { lessonId, id } = req.params;
            const session = await this.sessionService.getSessionById(id);
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }
            if (session.course?.ownerId !== req.body.ownerId) {
                res.status(403).json({ error: "You are not the owner of this course" });
                return;
            }
            const { materialIds } = req.body;
            await this.materialService.removeMaterialsFromLesson(lessonId, materialIds);
            res.status(200).json({ message: "Materials removed successfully" });
        }
        catch (error) {
            req.log.error({ err: error, lessonId: req.params.lessonId, id: req.params.id, materialIds: req.body?.materialIds }, "removeLessonMaterials failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    // remove course materials
    removeCourseMaterials = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { materialIds } = req.body;
            const course = await this.courseService.getCourseById(id);
            if (!course) {
                res.status(404).json({ error: "Course not found" });
                return;
            }
            if (course.ownerId !== req.body.ownerId) {
                res.status(403).json({ error: "You are not the owner of this course" });
                return;
            }
            await this.materialService.removeMaterialsFromCourse(id, materialIds);
            res.status(200).json({ message: "Materials removed successfully" });
        }
        catch (error) {
            req.log.error({ err: error, id: req.params.id, materialIds: req.body?.materialIds }, "removeCourseMaterials failed");
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
            await this.materialService.setCourseMaterialsSharable(courseId, isSharable);
            res.status(200).json({ message: `Course materials ${isSharable ? "shared" : "unshared"} successfully` });
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id, isSharable: req.body?.isSharable }, "toggleCourseMaterialsShare failed");
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
            const newValue = await this.materialService.toggleCourseMaterialSharable(courseId, materialId);
            res.status(200).json({
                message: `Course material ${newValue ? "shared" : "unshared"} successfully`,
                isSharable: newValue
            });
        } catch (error: any) {
            if (error.message.includes("Material link not found")) {
                res.status(404).json({ error: "Material link not found" });
                return;
            }
            req.log.error({ err: error, courseId: req.params.id, materialId: req.params.materialId }, "toggleCourseMaterialShare failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    // Toggle share/unshare for ALL lesson materials (under a session)
    toggleLessonMaterialsShare = async (req: Request, res: Response): Promise<void> => {
        try {
            const { lessonId, id } = req.params;
            const session = await this.sessionService.getSessionById(id);
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
            await this.materialService.setLessonMaterialsSharable(lessonId, isSharable);
            res.status(200).json({ message: `Lesson materials ${isSharable ? "shared" : "unshared"} successfully` });
        } catch (error) {
            req.log.error({ err: error, id: req.params.id, lessonId: req.params.lessonId, isSharable: req.body?.isSharable }, "toggleLessonMaterialsShare failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    // Toggle share/unshare for ONE lesson material (auto-toggle)
    toggleLessonMaterialShare = async (req: Request, res: Response): Promise<void> => {
        try {
            const { lessonId, id, materialId } = req.params;

            const session = await this.sessionService.getSessionById(id);
            if (!session) {
                res.status(404).json({ error: "Session not found" });
                return;
            }
            if (session.course?.ownerId !== req.body.ownerId) {
                res.status(403).json({ error: "You are not the owner of this course" });
                return;
            }
            const newValue = await this.materialService.toggleLessonMaterialSharable(lessonId, materialId);
            res.status(200).json({
                message: `Lesson material ${newValue ? "shared" : "unshared"} successfully`,
                isSharable: newValue
            });
        } catch (error) {
            req.log.error({ err: error, id: req.params.id, lessonId: req.params.lessonId, materialId: req.params.materialId }, "toggleLessonMaterialShare failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
}
