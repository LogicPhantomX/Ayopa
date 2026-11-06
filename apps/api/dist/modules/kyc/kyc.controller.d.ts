import { KycUploadDto } from './dto/kyc-upload.dto';
import { KycService } from './kyc.service';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    getForUser(userId: string): Promise<import("./entities/kyc-profile.entity").KycProfile>;
    submit(req: any, dto: KycUploadDto): Promise<import("./entities/kyc-profile.entity").KycProfile>;
    updateStatus(id: string, status: string, reviewNote?: string): Promise<import("./entities/kyc-profile.entity").KycProfile>;
}
