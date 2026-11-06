import { PayoutRequest } from './payout-request.entity';
export declare class PayoutApproval {
    id: string;
    payoutRequestId: string;
    payoutRequest: PayoutRequest;
    approvedBy: string;
    comment: string | null;
    approvedAt: Date;
}
