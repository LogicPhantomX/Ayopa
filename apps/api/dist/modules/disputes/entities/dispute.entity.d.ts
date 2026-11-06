import { Transaction } from '../../transactions/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';
export declare class Dispute {
    id: string;
    transaction: Transaction;
    transactionId: string;
    initiator: User;
    initiatorId: string;
    reason: string;
    status: string;
    responseDeadline: Date;
    appealCount: number;
    resolutionSummary: string;
    sellerResponse: string | null;
    createdAt: Date;
    updatedAt: Date;
}
