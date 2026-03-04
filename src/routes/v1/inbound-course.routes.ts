import express, { Request, Response } from "express";
import { AppDataSource } from "../../config/database";
import { CourseModel } from "../../models/course.model";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";

const router = express.Router();

/**
 * GET /inbounds/courses/teacher/:teacherId/count
 * Query params: since (ISO), until (ISO)
 * Returns the number of group and live courses the teacher created
 * within the given time window (their current subscription period).
 * Protected by x-internal-api-key (enforced in app-v1.ts).
 */
router.get("/teacher/:teacherId/count", async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    const until = req.query.until ? new Date(req.query.until as string) : new Date();

    if (!teacherId) {
        res.status(400).json({ error: "teacherId is required" });
        return;
    }

    try {
        const courseRepo = AppDataSource.getRepository(CourseModel);

        const [groupCount, liveCount] = await Promise.all([
            courseRepo.count({
                where: {
                    ownerId: teacherId,
                    type: "group",
                    createdAt: Between(since, until),
                },
                withDeleted: false,
            }),
            courseRepo.count({
                where: {
                    ownerId: teacherId,
                    type: "live",
                    createdAt: Between(since, until),
                },
                withDeleted: false,
            }),
        ]);

        res.status(200).json({ groupCount, liveCount });
    } catch (error: any) {
        console.error("[inbound/courses] Error counting teacher courses:", error?.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export { router as inboundCourseRouter };
