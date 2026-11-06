import { Repository } from 'typeorm';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycProfile } from './entities/kyc.entity';
export declare class KycService {
    private readonly kycRepository;
    constructor(kycRepository: Repository<KycProfile>);
    getForUser(userId: string): Promise<KycProfile>;
    submit(userId: string, dto: SubmitKycDto): Promise<KycProfile>;
    updateStatus(userId: string, status: string, reviewNote?: string): Promise<KycProfile>;
}
