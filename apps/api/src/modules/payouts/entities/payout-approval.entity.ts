import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { PayoutRequest } from './payout-request.entity';

@Entity({ name: 'payout_approvals' })
export class PayoutApproval {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'payout_request_id', type: 'uuid' })
    payoutRequestId: string;

    @ManyToOne(() => PayoutRequest, (req) => req.approvals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'payout_request_id' })
    payoutRequest: PayoutRequest;

    /** UUID of the admin who approved. */
    @Column({ name: 'approved_by', type: 'uuid' })
    approvedBy: string;

    @Column({ length: 255, nullable: true })
    comment: string | null;

    @CreateDateColumn({ name: 'approved_at' })
    approvedAt: Date;
}
