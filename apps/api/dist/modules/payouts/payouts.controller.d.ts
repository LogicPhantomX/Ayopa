import { ApprovePayoutDto } from './dto/approve-payout.dto';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { PayoutsService } from './payouts.service';
import { PayoutStatus } from './entities/payout-request.entity';
export declare class PayoutsController {
    private readonly payoutsService;
    constructor(payoutsService: PayoutsService);
    create(req: any, dto: CreatePayoutRequestDto): Promise<{
        message: string;
        data: import("./entities/payout-request.entity").PayoutRequest | any;
    }>;
    approve(id: string, req: any, dto: ApprovePayoutDto): Promise<{
        message: string;
        data: import("./entities/payout-request.entity").PayoutRequest;
    }>;
    reject(id: string, req: any, reason?: string): Promise<import("./entities/payout-request.entity").PayoutRequest>;
    findAll(status?: PayoutStatus): Promise<import("./entities/payout-request.entity").PayoutRequest[]>;
    findOne(id: string): Promise<import("./entities/payout-request.entity").PayoutRequest>;
}
