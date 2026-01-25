import { In, IsNull, Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { MaterialModel } from "../models/material.model";
import { MaterialLinkModel } from "../models/material-link.model";
import { CourseModel } from "../models/course.model";
import { logger } from "../utils/logger";
import { injectable, inject } from "tsyringe";

@injectable()
export class MaterialService {
    constructor(
        @inject("MaterialRepository") private materialRepo: Repository<MaterialModel>,
        @inject("MaterialLinkRepository") private materialLinkRepo: Repository<MaterialLinkModel>,
        @inject("CourseRepository") private courseRepo: Repository<CourseModel>
    ) { }

    async getCourseMaterials(id: string): Promise<MaterialLinkModel[]> {
        try {
            const links = await this.materialLinkRepo.find({
                where: { course: { id } },
                relations: ["material"],
                cache: false,
            });
            return links;
        } catch (error: any) {
            logger.error({ err: error, id }, "getCourseMaterials failed");
            throw new Error(
                "Error fetching course materials by ID : " + error.message
            );
        }
    }

    async getLessonMaterials(id: string): Promise<MaterialLinkModel[]> {
        try {
            const links = await this.materialLinkRepo.find({
                where: { lesson: { id } },
                relations: ["material"],
                cache: false,
            });
            return links;
        } catch (error: any) {
            logger.error({ err: error, id }, "getLessonMaterials failed");
            throw new Error(
                "Error fetching course materials by ID : " + error.message
            );
        }
    }

    async findMaterialsByIds(ids: string[]): Promise<MaterialModel[]> {
        try {
            if (!ids?.length) return [];
            return await this.materialRepo.find({
                where: { id: In(ids) },
            });
        } catch (error: any) {
            throw new Error("Error fetching materials: " + error.message);
        }
    }

    async addMaterialsToCourse(
        courseId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            if (!materialIds?.length) return;

            // Check for existing links (including soft-deleted ones)
            const existingLinks = await this.materialLinkRepo.find({
                where: {
                    course: { id: courseId },
                    material: { id: In(materialIds) },
                },
                relations: ["material"],
            });

            // Filter out materials that are already linked (not soft-deleted)
            const activeLinkIds = existingLinks
                .filter((link: any) => !link.deletedAt)
                .map((link: any) => link.material?.id)
                .filter(Boolean);

            const newMaterialIds = materialIds.filter(
                (id) => !activeLinkIds.includes(id)
            );

            if (newMaterialIds.length === 0) return;

            const materials = await this.materialRepo.find({
                where: { id: In(newMaterialIds) },
            });
            const course = await this.courseRepo.findOne({
                where: { id: courseId },
            });

            if (!course) throw new Error("Course not found");

            const links = materials.map((m: any) =>
                this.materialLinkRepo.create({ course, material: m })
            );
            await this.materialLinkRepo.save(links);
        } catch (error: any) {
            throw new Error("Error adding materials to course: " + error.message);
        }
    }

    async addMaterialsToLesson(
        lessonId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            if (!materialIds?.length) return;

            await this.materialLinkRepo
                .createQueryBuilder()
                .insert()
                .into(MaterialLinkModel)
                .values(
                    materialIds.map((materialId) => ({
                        lesson: { id: lessonId },
                        material: { id: materialId },
                    }))
                )
                .orIgnore()
                .execute();
        } catch (error: any) {
            throw new Error("Error adding materials to lesson: " + error.message);
        }
    }

    async addMaterialsToSession(
        sessionId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            if (!materialIds?.length) return;

            await this.materialLinkRepo
                .createQueryBuilder()
                .insert()
                .into(MaterialLinkModel)
                .values(
                    materialIds.map((materialId) => ({
                        session: { id: sessionId },
                        material: { id: materialId },
                    }))
                )
                .orIgnore()
                .execute();
        } catch (error: any) {
            throw new Error("Error adding materials to session: " + error.message);
        }
    }

    async addMaterialsToEnrollment(
        enrollmentId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            if (!materialIds?.length) return;

            await this.materialLinkRepo
                .createQueryBuilder()
                .insert()
                .into(MaterialLinkModel)
                .values(
                    materialIds.map((materialId) => ({
                        enrollment: { id: enrollmentId },
                        material: { id: materialId },
                    }))
                )
                .orIgnore()
                .execute();
        } catch (error: any) {
            throw new Error("Error adding materials to enrollment: " + error.message);
        }
    }

    async removeMaterialsFromLesson(
        lessonId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            const linksToDelete = await this.materialLinkRepo.find({
                where: {
                    lesson: { id: lessonId },
                    material: { id: In(materialIds) },
                },
            });

            if (linksToDelete.length > 0) {
                const linkIds = linksToDelete.map((link: any) => link.id);
                await this.materialLinkRepo.softDelete(linkIds);
            }
        } catch (error: any) {
            throw new Error("Error removing materials from lesson: " + error.message);
        }
    }

    async updateLessonMaterials(
        lessonId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            const rows = await this.materialLinkRepo
                .createQueryBuilder("ml")
                .select("ml.materialId", "materialId")
                .where("ml.lessonId = :lessonId", { lessonId })
                .andWhere("ml.deleted_at IS NULL")
                .getRawMany();

            const current = new Set<string>(rows.map((r: any) => r.materialId as string));
            const desired = new Set<string>(materialIds ?? []);

            const toRemove = Array.from(current).filter((id) => !desired.has(id));
            const toAdd = Array.from(desired).filter((id) => !current.has(id));

            if (toRemove.length > 0) {
                await this.materialLinkRepo
                    .createQueryBuilder()
                    .softDelete()
                    .where("lessonId = :lessonId", { lessonId })
                    .andWhere("materialId IN (:...ids)", { ids: toRemove })
                    .andWhere("deleted_at IS NULL")
                    .execute();
            }

            if (toAdd.length > 0) {
                await this.materialLinkRepo
                    .createQueryBuilder()
                    .insert()
                    .into(MaterialLinkModel)
                    .values(
                        toAdd.map((materialId) => ({
                            lesson: { id: lessonId },
                            material: { id: materialId },
                        }))
                    )
                    .orIgnore()
                    .execute();
            }
        } catch (error: any) {
            throw new Error("Error updating lesson materials: " + error.message);
        }
    }

    async updateSessionMaterials(
        sessionId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            const rows = await this.materialLinkRepo
                .createQueryBuilder("ml")
                .select("ml.materialId", "materialId")
                .where("ml.sessionId = :sessionId", { sessionId })
                .andWhere("ml.deleted_at IS NULL")
                .getRawMany();

            const current = new Set<string>(rows.map((r: any) => r.materialId as string));
            const desired = new Set<string>(materialIds ?? []);

            const toRemove = Array.from(current).filter((id) => !desired.has(id));
            const toAdd = Array.from(desired).filter((id) => !current.has(id));

            if (toRemove.length > 0) {
                await this.materialLinkRepo
                    .createQueryBuilder()
                    .softDelete()
                    .where("sessionId = :sessionId", { sessionId })
                    .andWhere("materialId IN (:...ids)", { ids: toRemove })
                    .andWhere("deleted_at IS NULL")
                    .execute();
            }

            if (toAdd.length > 0) {
                await this.materialLinkRepo
                    .createQueryBuilder()
                    .insert()
                    .into(MaterialLinkModel)
                    .values(
                        toAdd.map((materialId) => ({
                            session: { id: sessionId },
                            material: { id: materialId },
                        }))
                    )
                    .orIgnore()
                    .execute();
            }
        } catch (error: any) {
            throw new Error("Error updating session materials: " + error.message);
        }
    }

    async updateEnrollmentMaterials(
        enrollmentId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            const rows = await this.materialLinkRepo
                .createQueryBuilder("ml")
                .select("ml.materialId", "materialId")
                .where("ml.enrollmentId = :enrollmentId", { enrollmentId })
                .andWhere("ml.deleted_at IS NULL")
                .getRawMany();

            const current = new Set<string>(rows.map((r: any) => r.materialId as string));
            const desired = new Set<string>(materialIds ?? []);

            const toRemove = Array.from(current).filter((id) => !desired.has(id));
            const toAdd = Array.from(desired).filter((id) => !current.has(id));

            if (toRemove.length > 0) {
                await this.materialLinkRepo
                    .createQueryBuilder()
                    .softDelete()
                    .where("enrollmentId = :enrollmentId", { enrollmentId })
                    .andWhere("materialId IN (:...ids)", { ids: toRemove })
                    .andWhere("deleted_at IS NULL")
                    .execute();
            }

            if (toAdd.length > 0) {
                await this.materialLinkRepo
                    .createQueryBuilder()
                    .insert()
                    .into(MaterialLinkModel)
                    .values(
                        toAdd.map((materialId) => ({
                            enrollment: { id: enrollmentId },
                            material: { id: materialId },
                        }))
                    )
                    .orIgnore()
                    .execute();
            }
        } catch (error: any) {
            throw new Error("Error updating enrollment materials: " + error.message);
        }
    }

    async removeMaterialsFromCourse(
        courseId: string,
        materialIds: string[]
    ): Promise<void> {
        try {
            const linksToDelete = await this.materialLinkRepo.find({
                where: {
                    course: { id: courseId },
                    material: { id: In(materialIds) },
                },
            });

            if (linksToDelete.length > 0) {
                const linkIds = linksToDelete.map((link: any) => link.id);
                await this.materialLinkRepo.softDelete(linkIds);
            }
        } catch (error: any) {
            throw new Error("Error removing materials from course: " + error.message);
        }
    }

    async setCourseMaterialsSharable(
        courseId: string,
        isSharable: boolean
    ): Promise<void> {
        try {
            await this.materialLinkRepo
                .createQueryBuilder()
                .update()
                .set({ isSharable })
                .where("courseId = :courseId", { courseId })
                .andWhere("deleted_at IS NULL")
                .execute();
        } catch (error: any) {
            throw new Error(
                "Error toggling course materials share: " + error.message
            );
        }
    }

    async toggleCourseMaterialSharable(
        courseId: string,
        materialId: string
    ): Promise<boolean> {
        try {
            const link = await this.materialLinkRepo.findOne({
                where: {
                    course: { id: courseId },
                    material: { id: materialId },
                    deletedAt: IsNull(),
                },
            });

            if (!link) {
                throw new Error("Material link not found");
            }

            const newValue = !link.isSharable;

            await this.materialLinkRepo
                .createQueryBuilder()
                .update()
                .set({ isSharable: newValue })
                .where("courseId = :courseId", { courseId })
                .andWhere("materialId = :materialId", { materialId })
                .andWhere("deleted_at IS NULL")
                .execute();

            return newValue;
        } catch (error: any) {
            throw new Error("Error toggling course material share: " + error.message);
        }
    }

    async setLessonMaterialsSharable(
        lessonId: string,
        isSharable: boolean
    ): Promise<void> {
        try {
            await this.materialLinkRepo
                .createQueryBuilder()
                .update()
                .set({ isSharable })
                .where("lessonId = :lessonId", { lessonId })
                .andWhere("deleted_at IS NULL")
                .execute();
        } catch (error: any) {
            throw new Error(
                "Error toggling lesson materials share: " + error.message
            );
        }
    }

    async toggleLessonMaterialSharable(
        lessonId: string,
        materialId: string
    ): Promise<boolean> {
        try {
            const link = await this.materialLinkRepo.findOne({
                where: {
                    lesson: { id: lessonId },
                    material: { id: materialId },
                    deletedAt: IsNull(),
                },
            });

            if (!link) {
                throw new Error("Material link not found");
            }

            const newValue = !link.isSharable;

            await this.materialLinkRepo
                .createQueryBuilder()
                .update()
                .set({ isSharable: newValue })
                .where("lessonId = :lessonId", { lessonId })
                .andWhere("materialId = :materialId", { materialId })
                .andWhere("deleted_at IS NULL")
                .execute();

            return newValue;
        } catch (error: any) {
            throw new Error("Error toggling lesson material share: " + error.message);
        }
    }
}
