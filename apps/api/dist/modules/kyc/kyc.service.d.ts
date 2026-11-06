import { Repository } from 'typeorm';
import { KycProfile } from './entities/kyc-profile.entity';
import { AuditService } from '../audit/audit.service';
import { KycUploadDto } from './dto/kyc-upload.dto';
export declare class KycService {
    private readonly kycRepository;
    private readonly auditService;
    private readonly logger;
    constructor(kycRepository: Repository<KycProfile>, auditService: AuditService);
    issuePar(userId: string, idType: string): Promise<{
        uploadUrl: string;
        expiresAt: Date;
    }>;
    verifyId(idType: string, idNumber: string): Promise<{
        status: string;
        reason: string;
        nameMatch?: undefined;
        externalRef?: undefined;
    } | {
        status: string;
        nameMatch: boolean;
        externalRef: string;
        reason?: undefined;
    }>;
    scanDocument(bucketPath: string): Promise<boolean>;
    getForUser(userId: string): Promise<KycProfile>;
    submit(userId: string, dto: KycUploadDto): Promise<KycProfile>;
    updateStatus(id: string, status: string, reviewNote?: string): Promise<KycProfile>;
    submitKyc(userId: string, data: {
        idType: string;
        idNumber: string;
        bucketPath: string;
    }): Promise<KycProfile>;
}
