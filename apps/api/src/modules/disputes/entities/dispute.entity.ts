import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'disputes' })
export class Dispute {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Transaction, { eager: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;

    @Column({ name: 'transaction_id', type: 'uuid', unique: true })
    transactionId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'initiator_id' })
    initiator: User;

    @Column({ name: 'initiator_id', type: 'uuid' })
    initiatorId: string;

    @Column({ type: 'text' })
    reason: string;

    @Column({ default: 'open' })
    status: string;

    @Column({ name: 'response_deadline', type: 'timestamptz' })
    responseDeadline: Date;

    @Column({ name: 'appeal_count', default: 0 })
    appealCount: number;

    @Column({ name: 'resolution_summary', type: 'text', nullable: true })
    resolutionSummary: string;

    @Column({ name: 'seller_response', type: 'text', nullable: true })
    sellerResponse: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
