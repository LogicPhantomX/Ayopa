import { AuthService } from './auth.service';
import { SetupProfileDto } from './dto/setup-profile.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterUserDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: import("../users/entities/user.entity").UserRole;
            isActive: boolean;
            isVerified: boolean;
            isProvisional: boolean;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginUserDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: import("../users/entities/user.entity").UserRole;
            isActive: boolean;
            isVerified: boolean;
            isProvisional: boolean;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    requestOtp(dto: {
        phone: string;
    }): Promise<{
        success: boolean;
        devMode: boolean;
        phone: string;
        expiresIn: number;
    }>;
    verifyOtp(dto: {
        phone: string;
        code: string;
    }): Promise<{
        nextStep: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: import("../users/entities/user.entity").UserRole;
            isActive: boolean;
            isVerified: boolean;
            isProvisional: boolean;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
    setupProfile(req: any, dto: SetupProfileDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: import("../users/entities/user.entity").UserRole;
            isActive: boolean;
            isVerified: boolean;
            isProvisional: boolean;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    refresh(dto: {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
