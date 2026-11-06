import { PayoutApproval } from './payout-approval.entity';
export type PayoutStatus = 'pending' | 'approved' | 'executing' | 'completed' | 'rejected' | 'failed';
export declare class PayoutRequest {
    id: string;
    recipientCode: string;
    amount: number;
    reason: string;
    status: PayoutStatus;
    transferCode: string | null;
    requestedBy: string;
    approvals: PayoutApproval[];
    createdAt: Date;
    updatedAt: Date;
}
