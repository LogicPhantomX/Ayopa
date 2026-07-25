import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity({ name: 'escrow_events' })
export class EscrowEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Transaction, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;

    @Column({ name: 'transaction_id', type: 'uuid' })
    transactionId: string;

    @Column({ name: 'from_status', length: 50, nullable: true })
    fromStatus: string | null;

    @Column({ name: 'to_status', length: 50 })
    toStatus: string;

    @Column({ name: 'actor_id', type: 'uuid', nullable: true })
    actorId: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
