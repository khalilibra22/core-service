import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { CertificateModel } from "../models/certificate.model";
import { injectable, inject } from "tsyringe";

@injectable()
export class CertificateService {
    constructor(@inject("CertificateRepository") private certificateRepo: Repository<CertificateModel>) { }

    async createCertificate(
        certificate: CertificateModel
    ): Promise<CertificateModel> {
        try {
            return await this.certificateRepo.save(certificate);
        } catch (error) {
            throw new Error("Error creating certificate");
        }
    }
}
