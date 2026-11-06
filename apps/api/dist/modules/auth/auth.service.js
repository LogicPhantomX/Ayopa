"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const email_service_1 = require("../email/email.service");
const sms_service_1 = require("../sms/sms.service");
const user_entity_1 = require("../users/entities/user.entity");
const setup_profile_dto_1 = require("./dto/setup-profile.dto");
const otp_store_1 = require("./otp-store");
const refresh_token_store_1 = require("./refresh-token-store");
let AuthService = class AuthService {
    userRepository;
    jwtService;
    configService;
    otpStore;
    refreshTokenStore;
    smsService;
    emailService;
    constructor(userRepository, jwtService, configService, otpStore, refreshTokenStore, smsService, emailService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.otpStore = otpStore;
        this.refreshTokenStore = refreshTokenStore;
        this.smsService = smsService;
        this.emailService = emailService;
    }
    async register(dto) {
        if (!dto.email && !dto.phone) {
            throw new common_1.BadRequestException('Either an email or a phone number is required.');
        }
        const existing = await this.userRepository.findOne({
            where: [
                ...(dto.email ? [{ email: dto.email }] : []),
                ...(dto.phone ? [{ phone: dto.phone }] : []),
            ],
        });
        if (existing) {
            throw new common_1.ConflictException('A user with this identifier already exists.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = this.userRepository.create({
            email: dto.email ?? null,
            passwordHash,
            fullName: dto.fullName,
            phone: dto.phone ?? null,
            role: 'buyer',
            isVerified: !!dto.phone,
        });
        const savedUser = await this.userRepository.save(user);
        const { accessToken, refreshToken } = await this.issueTokenPair(savedUser);
        if (savedUser.email) {
            await this.emailService
                .sendRegistrationEmail(savedUser.email, savedUser.fullName)
                .catch(() => { });
        }
        return { user: this.toPublicUser(savedUser), accessToken, refreshToken };
    }
    async login(dto) {
        if (!dto.password) {
            throw new common_1.UnauthorizedException('Password is required for this login method.');
        }
        const user = await this.userRepository.findOne({
            where: [{ email: dto.identifier }, { phone: dto.identifier }],
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatches) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated.');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.UnauthorizedException('Account is temporarily locked.');
        }
        const { accessToken, refreshToken } = await this.issueTokenPair(user);
        return { user: this.toPublicUser(user), accessToken, refreshToken };
    }
    async requestPhoneOtp(dto) {
        const code = this.generateOtp();
        const devMode = this.configService.get('OTP_DEV_MODE', 'false') === 'true';
        await this.otpStore.setOtp(dto.phone, code, 300);
        if (devMode) {
            console.log(`[DEV] OTP for ${dto.phone}: ${code}`);
        }
        await this.smsService
            .sendOtp(dto.phone, code, 5)
            .catch(() => { });
        return {
            success: true,
            devMode,
            phone: dto.phone,
            expiresIn: 300,
        };
    }
    async verifyPhoneOtp(dto) {
        const result = await this.otpStore.verifyOtp(dto.phone, dto.code);
        if (!result.ok) {
            throw new common_1.UnauthorizedException(result.locked ? 'OTP locked.' : 'Invalid OTP.');
        }
        let user = await this.userRepository.findOne({ where: { phone: dto.phone } });
        let isNewUser = false;
        if (!user) {
            user = this.userRepository.create({
                phone: dto.phone,
                email: null,
                passwordHash: null,
                fullName: null,
                role: 'provisional',
                isVerified: true,
                isActive: true,
            });
            user = await this.userRepository.save(user);
            isNewUser = true;
        }
        const { accessToken, refreshToken } = await this.issueTokenPair(user);
        return {
            user: this.toPublicUser(user),
            accessToken,
            refreshToken,
            isNewUser,
            ...(isNewUser && {
                nextStep: 'POST /auth/profile/setup — provide fullName and role (buyer|seller)',
            }),
        };
    }
    async setupProfile(userId, dto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        if (user.role !== 'provisional') {
            throw new common_1.ForbiddenException('Profile is already complete.');
        }
        user.fullName = dto.fullName;
        user.role = dto.role;
        const savedUser = await this.userRepository.save(user);
        await this.refreshTokenStore.revokeAllForUser(userId);
        const { accessToken, refreshToken } = await this.issueTokenPair(savedUser);
        return {
            user: this.toPublicUser(savedUser),
            accessToken,
            refreshToken,
            message: dto.role === setup_profile_dto_1.IntendedRole.SELLER
                ? 'Profile complete. Upload KYC documents at POST /kyc/upload before listing livestock.'
                : 'Profile complete. You can now browse and purchase livestock.',
        };
    }
    async refreshToken(token) {
        const userId = await this.refreshTokenStore.consume(token);
        if (!userId) {
            throw new common_1.UnauthorizedException('Invalid or already-used refresh token.');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        }
        const { accessToken, refreshToken } = await this.issueTokenPair(user);
        return { accessToken, refreshToken };
    }
    async validateUser(userId) {
        return this.userRepository.findOne({ where: { id: userId } });
    }
    async issueTokenPair(user) {
        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(user.id, user.email, user.role),
            this.refreshTokenStore.issue(user.id),
        ]);
        return { accessToken, refreshToken };
    }
    async signAccessToken(userId, email, role) {
        return this.jwtService.signAsync({ sub: userId, email, role });
    }
    generateOtp() {
        return (0, crypto_1.randomInt)(100000, 1000000).toString();
    }
    toPublicUser(user) {
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            isProvisional: user.role === 'provisional',
            createdAt: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        otp_store_1.OtpStore,
        refresh_token_store_1.RefreshTokenStore,
        sms_service_1.SmsService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map