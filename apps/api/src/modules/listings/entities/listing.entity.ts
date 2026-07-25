import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// ── Item 3: Listings soft delete ──────────────────────────────────────────────
// @DeleteDateColumn adds `deleted_at TIMESTAMPTZ` which TypeORM uses to
// implement soft-delete. findOne / find / createQueryBuilder calls
// automatically filter out rows where deleted_at IS NOT NULL. Admins can
// query deleted rows by using withDeleted() on the query builder.

@Entity({ name: 'listings' })
export class Listing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'seller_id' })
    seller: User;

    @Column({ name: 'seller_id', type: 'uuid' })
    sellerId: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ length: 100 })
    category: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    price: number;

    @Column({ length: 10, default: 'NGN' })
    currency: string;

    @Column({ type: 'text', nullable: true })
    location: string;

    @Column({ default: 'draft' })
    status: string;

    @Column({ name: 'is_featured', default: false })
    isFeatured: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date | null;
}
