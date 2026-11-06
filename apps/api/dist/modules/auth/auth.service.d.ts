import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { SetupProfileDto } from './dto/setup-profile.dto';
import { OtpStore } from './otp-store';
import { RefreshTokenStore } from './refresh-token-store';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly otpStore;
    private readonly refreshTokenStore;
    private readonly smsService;
    private readonly emailService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, configService: ConfigService, otpStore: OtpStore, refreshTokenStore: RefreshTokenStore, smsService: SmsService, emailService: EmailService);
    register(dto: RegisterUserDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: UserRole;
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
            role: UserRole;
            isActive: boolean;
            isVerified: boolean;
            isProvisional: boolean;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    requestPhoneOtp(dto: {
        phone: string;
    }): Promise<{
        success: boolean;
        devMode: boolean;
        phone: string;
        expiresIn: number;
    }>;
    verifyPhoneOtp(dto: {
        phone: string;
        code: string;
    }): Promise<{
        nextStep: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: UserRole;
            isActive: boolean;
            isVerified: boolean;
            isProvisional: boolean;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
    setupProfile(userId: string, dto: SetupProfileDto): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string;
            role: UserRole;
            isActive: boolean;
            isVerified: boolean;
            isProvisional: boolean;
            createdAt: Date;
        };
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    validateUser(userId: string): Promise<User>;
    private issueTokenPair;
    private signAccessToken;
    private generateOtp;
    private toPublicUser;
}
