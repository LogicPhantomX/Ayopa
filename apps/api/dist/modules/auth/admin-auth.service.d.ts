import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshTokenStore } from './refresh-token-store';
export declare class AdminAuthService {
    private readonly userRepository;
    private readonly configService;
    private readonly jwtService;
    private readonly refreshTokenStore;
    private readonly totp;
    constructor(userRepository: Repository<User>, configService: ConfigService, jwtService: JwtService, refreshTokenStore: RefreshTokenStore);
    loginAdmin(email: string, password: string): Promise<{
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
    verifyAdminTotp(email: string, code: string): Promise<{
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
    unlockAdmin(actorRole: string, targetEmail: string): Promise<{
        success: boolean;
        email: string;
    }>;
    private findAdminOrThrow;
    private assertNotLocked;
    private registerFailure;
}
