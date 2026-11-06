import { AdminAuthService } from './admin-auth.service';
export declare class AdminAuthController {
    private readonly adminAuthService;
    constructor(adminAuthService: AdminAuthService);
    login(dto: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        requiresTotp: boolean;
        enrolling: boolean;
        email: string;
        totpSecret: string;
        otpauthUrl: string;
    } | {
        success: boolean;
        requiresTotp: boolean;
        enrolling: boolean;
        email: string;
        totpSecret?: undefined;
        otpauthUrl?: undefined;
    }>;
    verifyTotp(dto: {
        email: string;
        code: string;
    }): Promise<{
        success: boolean;
        verified: boolean;
        accessToken?: undefined;
        refreshToken?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        verified: boolean;
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../users/entities/user.entity").UserRole;
        };
    }>;
    unlock(dto: {
        actorRole: string;
        targetEmail: string;
    }): Promise<{
        success: boolean;
        email: string;
    }>;
}
