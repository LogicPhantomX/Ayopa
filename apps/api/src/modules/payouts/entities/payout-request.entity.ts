import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PayoutApproval } from './payout-approval.entity';

export type PayoutStatus =
    | 'pending'
    | 'approved'         // ≥2 distinct approvals received
    | 'executing'
    | 'completed'
    | 'rejected'
    | 'failed';

/**
 * A payout request that requires dual-admin approval before the Paystack
 * transfer is executed.  Only created for amounts > ₦500,000 (50,000,000 kobo).
 */
@Entity({ name: 'payout_requests' })
export class PayoutRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Paystack recipient_code to send money to. */
    @Column({ name: 'recipient_code', length: 100 })
    recipientCode: string;

    /** Transfer amount in kobo (smallest unit). */
    @Column({ type: 'bigint' })
    amount: number;

    @Column({ length: 255, default: '' })
    reason: string;

    @Column({ name: 'status', length: 50, default: 'pending' })
    status: PayoutStatus;

    /** Paystack transfer_code, populated after the transfer is executed. */
    @Column({ name: 'transfer_code', length: 100, nullable: true })
    transferCode: string | null;

    /** Admin who initiated the request (first requester — not an approver). */
    @Column({ name: 'requested_by', type: 'uuid' })
    requestedBy: string;

    @OneToMany(() => PayoutApproval, (approval) => approval.payoutRequest, {
        eager: true,
        cascade: true,
    })
    approvals: PayoutApproval[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
