export type UserRole = 'provisional' | 'buyer' | 'seller' | 'admin' | 'super_admin';
export declare class User {
    id: string;
    email: string | null;
    passwordHash: string | null;
    fullName: string | null;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
    adminTotpSecret: string | null;
    createdAt: Date;
    updatedAt: Date;
    get isProvisional(): boolean;
}
