import { Transaction } from '../../transactions/entities/transaction.entity';
export declare class EscrowEvent {
    id: string;
    transaction: Transaction;
    transactionId: string;
    fromStatus: string | null;
    toStatus: string;
    actorId: string | null;
    metadata: any;
    createdAt: Date;
}
