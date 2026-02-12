import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { CourseService } from "../services/course.service";
import { CertificateService } from "../services/certificate.service";
import { plainToInstance } from "class-transformer";
import { CertificateDto } from "../dtos/certificate.dto";
import { DtoService } from "../services/dto.service";

@injectable()
export class CourseCertificateController {
    constructor(
        @inject(CourseService) private courseService: CourseService,
        @inject(CertificateService) private certificateService: CertificateService,
        @inject(DtoService) private dtoService: DtoService
    ) { }

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
            const certificate = await this.certificateService.createCertificate(
                certificateBody
            );

            const certificateDto = await this.dtoService.enrichDto<CertificateDto>(CertificateDto, certificate);
            res.status(201).json(certificateDto);
        } catch (error) {
            req.log.error({ err: error, courseId: req.params.id }, "createCertificate failed");
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
}
