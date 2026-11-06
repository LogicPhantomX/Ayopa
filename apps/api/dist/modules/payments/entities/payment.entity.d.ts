import { Transaction } from '../../transactions/entities/transaction.entity';
export declare class Payment {
    id: string;
    transaction: Transaction;
    transactionId: string;
    provider: string;
    status: string;
    reference: string;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}
