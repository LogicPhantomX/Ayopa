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
exports.AdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const totp_1 = require("@otplib/totp");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const cjs_safe_base32_1 = require("./cjs-safe-base32");
const node_crypto_plugin_1 = require("./node-crypto-plugin");
const refresh_token_store_1 = require("./refresh-token-store");
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 30 * 60 * 1000;
let AdminAuthService = class AdminAuthService {
    userRepository;
    configService;
    jwtService;
    refreshTokenStore;
    totp;
    constructor(userRepository, configService, jwtService, refreshTokenStore) {
        this.userRepository = userRepository;
        this.configService = configService;
        this.jwtService = jwtService;
        this.refreshTokenStore = refreshTokenStore;
        this.totp = new totp_1.TOTP({ crypto: node_crypto_plugin_1.NodeCryptoPlugin, base32: cjs_safe_base32_1.CjsSafeBase32Plugin });
    }
    async loginAdmin(email, password) {
        const user = await this.findAdminOrThrow(email);
        this.assertNotLocked(user);
        const matches = await bcrypt.compare(password, user.passwordHash);
        if (!matches) {
            await this.registerFailure(user);
            throw new common_1.UnauthorizedException('Invalid admin credentials.');
        }
        if (!user.adminTotpSecret) {
            const secret = this.totp.generateSecret();
            user.adminTotpSecret = secret;
            user.failedLoginAttempts = 0;
            await this.userRepository.save(user);
            return {
                success: true,
                requiresTotp: true,
                enrolling: true,
                email,
                totpSecret: secret,
                otpauthUrl: this.totp.toURI({ secret, label: email, issuer: 'Marketplace Admin' }),
            };
        }
        return {
            success: true,
            requiresTotp: true,
            enrolling: false,
            email,
        };
    }
    async verifyAdminTotp(email, code) {
        const user = await this.findAdminOrThrow(email);
        this.assertNotLocked(user);
        if (!user.adminTotpSecret) {
            throw new common_1.UnauthorizedException('TOTP is not enrolled for this admin.');
        }
        const result = await this.totp.verify(code, { secret: user.adminTotpSecret });
        if (!result.valid) {
            await this.registerFailure(user);
            return { success: false, verified: false };
        }
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.userRepository.save(user);
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role }),
            this.refreshTokenStore.issue(user.id),
        ]);
        return {
            success: true,
            verified: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
        };
    }
    async unlockAdmin(actorRole, targetEmail) {
        if (actorRole !== 'super_admin') {
            throw new common_1.ForbiddenException('Only a super_admin can unlock an admin account.');
        }
        const user = await this.findAdminOrThrow(targetEmail);
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.userRepository.save(user);
        return { success: true, email: targetEmail };
    }
    async findAdminOrThrow(email) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            throw new common_1.UnauthorizedException('Invalid admin credentials.');
        }
        return user;
    }
    assertNotLocked(user) {
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
            throw new common_1.UnauthorizedException('Admin account is locked. Contact a super_admin to unlock.');
        }
    }
    async registerFailure(user) {
        const attempts = user.failedLoginAttempts + 1;
        user.failedLoginAttempts = attempts;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        }
        await this.userRepository.save(user);
    }
};
exports.AdminAuthService = AdminAuthService;
exports.AdminAuthService = AdminAuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService,
        jwt_1.JwtService,
        refresh_token_store_1.RefreshTokenStore])
], AdminAuthService);
//# sourceMappingURL=admin-auth.service.js.map