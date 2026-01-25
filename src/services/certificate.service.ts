import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { CertificateModel } from "../models/certificate.model";

export class CertificateService {
    private certificateRepo: Repository<CertificateModel>;

    constructor(repo?: Repository<CertificateModel>) {
        this.certificateRepo = repo || AppDataSource.getRepository(CertificateModel);
    }

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
