import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'kyc_profiles' })
export class KycProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'id_type', length: 50 })
    idType: string; // 'NIMC' or 'BVN'

    @Column({ name: 'id_number', length: 255 })
    idNumber: string; // Should be encrypted in production

    @Column({ name: 'oci_bucket_path', length: 500, nullable: true })
    ociBucketPath: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ name: 'virus_scan_passed', default: false })
    virusScanPassed: boolean;

    @Column({ name: 'verification_details', type: 'jsonb', nullable: true })
    verificationDetails: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
