import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity({ name: 'payments' })
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Transaction, { eager: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;

    @Column({ name: 'transaction_id', type: 'uuid' })
    transactionId: string;

    @Column({ length: 100, default: 'pending' })
    provider: string;

    @Column({ length: 50, default: 'pending' })
    status: string;

    @Column({ type: 'text', nullable: true })
    reference: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
