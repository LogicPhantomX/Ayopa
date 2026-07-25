import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';
import { User } from '../../users/entities/user.entity';

export enum EscrowStatus {
    CREATED = 'CREATED',
    PAYMENT_HELD = 'PAYMENT_HELD',
    FIRST_RELEASED = 'FIRST_RELEASED',
    DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
    COMPLETED = 'COMPLETED',
    DISPUTED = 'DISPUTED',
    DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
    REFUNDED = 'REFUNDED'
}

@Entity({ name: 'transactions' })
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'buyer_id' })
    buyer: User;

    @Column({ name: 'buyer_id', type: 'uuid' })
    buyerId: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'seller_id' })
    seller: User;

    @Column({ name: 'seller_id', type: 'uuid' })
    sellerId: string;

    @ManyToOne(() => Listing, { eager: true, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;

    @Column({ name: 'listing_id', type: 'uuid' })
    listingId: string;

    @Column({ type: 'numeric', precision: 15, scale: 2 })
    amount: number;

    @Column({ length: 10, default: 'NGN' })
    currency: string;

    @Column({
        type: 'varchar',
        length: 50,
        default: EscrowStatus.CREATED
    })
    status: EscrowStatus;

    @Column({ name: 'commission_amount', type: 'numeric', precision: 15, scale: 2, default: 0 })
    commissionAmount: number;

    @Column({ name: 'first_release_amount', type: 'numeric', precision: 15, scale: 2, default: 0 })
    firstReleaseAmount: number;

    @Column({ name: 'escrow_released', default: false })
    escrowReleased: boolean;

    @Column({ name: 'auto_release_at', type: 'timestamptz', nullable: true })
    autoReleaseAt: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
