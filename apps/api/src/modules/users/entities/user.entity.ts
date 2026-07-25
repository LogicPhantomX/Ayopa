import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * User roles:
 *   provisional — created on first OTP verify; cannot transact until profile is complete
 *   buyer       — active buyer account (full marketplace access)
 *   seller      — active seller account (requires KYC approval before listing)
 *   admin       — platform administrator
 */
export type UserRole = 'provisional' | 'buyer' | 'seller' | 'admin' | 'super_admin';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'email', length: 255, nullable: true, unique: true })
    email: string | null;

    /**
     * Nullable because provisional users (phone-OTP onboarding) never set a password.
     * Email/password login requires this to be non-null.
     */
    @Column({ name: 'password_hash', length: 255, nullable: true })
    @Exclude()
    passwordHash: string | null;

    /**
     * Nullable because provisional users haven't completed their profile yet.
     * Populated via POST /auth/profile/setup.
     */
    @Column({ name: 'full_name', length: 255, nullable: true })
    fullName: string | null;

    @Column({ name: 'phone', length: 50, nullable: true, unique: true })
    phone: string | null;

    @Column({ name: 'role', length: 50, default: 'provisional' })
    role: UserRole;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    // --- Admin lockout / TOTP ---

    @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
    @Exclude()
    failedLoginAttempts: number;

    @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
    @Exclude()
    lockedUntil: Date | null;

    @Column({ name: 'admin_totp_secret', length: 255, nullable: true })
    @Exclude()
    adminTotpSecret: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    /** Convenience getter used in business logic and guards. */
    get isProvisional(): boolean {
        return this.role === 'provisional';
    }
}
