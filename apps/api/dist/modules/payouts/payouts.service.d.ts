import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { PaystackService } from '../paystack/paystack.service';
import { ApprovePayoutDto } from './dto/approve-payout.dto';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { PayoutApproval } from './entities/payout-approval.entity';
import { PayoutRequest, PayoutStatus } from './entities/payout-request.entity';
export declare class PayoutsService {
    private readonly payoutRequestRepo;
    private readonly payoutApprovalRepo;
    private readonly paystackService;
    private readonly auditService;
    private readonly logger;
    constructor(payoutRequestRepo: Repository<PayoutRequest>, payoutApprovalRepo: Repository<PayoutApproval>, paystackService: PaystackService, auditService: AuditService);
    createPayoutRequest(requestedBy: string, dto: CreatePayoutRequestDto): Promise<{
        message: string;
        data: PayoutRequest | any;
    }>;
    approvePayout(payoutRequestId: string, adminId: string, dto: ApprovePayoutDto): Promise<{
        message: string;
        data: PayoutRequest;
    }>;
    rejectPayout(payoutRequestId: string, adminId: string, reason?: string): Promise<PayoutRequest>;
    findAll(status?: PayoutStatus): Promise<PayoutRequest[]>;
    findOne(id: string): Promise<PayoutRequest>;
    private executeTransfer;
}
