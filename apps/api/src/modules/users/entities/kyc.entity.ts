import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'kyc_profiles' })
export class KycProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ nullable: true })
    idType: string;

    @Column({ nullable: true })
    idNumber: string;

    @Column({ nullable: true })
    bvn: string;

    @Column({ nullable: true })
    address: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ nullable: true })
    reviewNote: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
