import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { StudentRequestService } from "../services/student-request.service";
import { plainToInstance } from "class-transformer";
import { StudentRequestDto } from "../dtos/student-request.dto";
import { setPaginationHeaders } from "../utils";

@injectable()
export class StudentRequestController {
    constructor(
        @inject(StudentRequestService) private studentRequestService: StudentRequestService
    ) { }

    createStudentRequest = async (req: Request, res: Response): Promise<void> => {
        try {
            const courseId = req.params.courseId;
            const studentId = req.body.ownerId;

            if (!courseId) {
                res.status(400).json({ error: "Course ID is required" });
                return;
            }

            const requestBody = {
                studentId,
                type: req.body.type,
                message: req.body.message,
                payload: req.body.payload,
                course: { id: courseId },
            };

            const studentRequest = await this.studentRequestService.createStudentRequest(requestBody as any);

            const studentRequestDto = plainToInstance(StudentRequestDto, studentRequest, {
                excludeExtraneousValues: true,
            });

            res.status(201).json(studentRequestDto);
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.courseId }, "createStudentRequest failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getStudentRequestById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const studentRequest = await this.studentRequestService.getStudentRequestById(id);

            if (!studentRequest) {
                res.status(404).json({ error: "Student request not found" });
                return;
            }

            const studentRequestDto = plainToInstance(StudentRequestDto, studentRequest, {
                excludeExtraneousValues: true,
            });

            res.status(200).json(studentRequestDto);
        } catch (error) {
            req.log.error({ err: error, requestId: req.params.id }, "getStudentRequestById failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getStudentRequestsByStudentId = async (req: Request, res: Response): Promise<void> => {
        try {
            const studentId = req.body.ownerId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const { data: studentRequests, total } = await this.studentRequestService.getStudentRequestsByStudentId(
                studentId,
                page,
                limit
            );

            const studentRequestDtos = plainToInstance(StudentRequestDto, studentRequests, {
                excludeExtraneousValues: true,
            });

            setPaginationHeaders(res, total, page, limit);
            res.status(200).json(studentRequestDtos);
        } catch (error) {
            req.log.error({ err: error, studentId: req.body.ownerId, page: req.query.page, limit: req.query.limit }, "getStudentRequestsByStudentId failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    getStudentRequestsByOwnerId = async (req: Request, res: Response): Promise<void> => {
        try {
            const ownerId = req.body.ownerId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const { data: studentRequests, total } = await this.studentRequestService.getStudentRequestsByOwnerId(
                ownerId,
                page,
                limit
            );

            const studentRequestDtos = plainToInstance(StudentRequestDto, studentRequests, {
                excludeExtraneousValues: true,
            });

            setPaginationHeaders(res, total, page, limit);
            res.status(200).json(studentRequestDtos);
        } catch (error) {
            req.log.error({ err: error, ownerId: req.body.ownerId, page: req.query.page, limit: req.query.limit }, "getStudentRequestsByOwnerId failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    updateStudentRequestStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const studentRequest = await this.studentRequestService.getStudentRequestById(id);

            if (!studentRequest) {
                res.status(404).json({ error: "Student request not found" });
                return;
            }

            const updatedRequest = {
                ...studentRequest,
                status: req.body.status,
                ownerResponse: req.body.ownerResponse,
                respondedBy: req.body.ownerId,
                respondedAt: new Date(),
            };

            await this.studentRequestService.updateStudentRequest(updatedRequest as any);
            res.status(200).json({ message: "Student request status updated successfully" });
        } catch (error) {
            req.log.error({ err: error, requestId: req.params.id }, "updateStudentRequestStatus failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

    deleteStudentRequest = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = req.params.id;
            const studentRequest = await this.studentRequestService.getStudentRequestById(id);

            if (!studentRequest) {
                res.status(404).json({ error: "Student request not found" });
                return;
            }

            await this.studentRequestService.deleteStudentRequest(id);
            res.status(204).send();
        } catch (error) {
            req.log.error({ err: error, requestId: req.params.id }, "deleteStudentRequest failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
}
