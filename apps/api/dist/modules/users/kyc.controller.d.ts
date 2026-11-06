import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycService } from './kyc.service';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    getForUser(userId: string): Promise<import("./entities/kyc.entity").KycProfile>;
    submit(req: any, dto: SubmitKycDto): Promise<import("./entities/kyc.entity").KycProfile>;
    updateStatus(userId: string, body: {
        status: string;
        reviewNote?: string;
    }): Promise<import("./entities/kyc.entity").KycProfile>;
}
