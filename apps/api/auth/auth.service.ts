import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { IntendedRole, SetupProfileDto } from './dto/setup-profile.dto';
import { OtpStore } from './otp-store';
import { RefreshTokenStore } from './refresh-token-store';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly otpStore: OtpStore,
        private readonly refreshTokenStore: RefreshTokenStore,
        private readonly smsService: SmsService,
        private readonly emailService: EmailService,
    ) {}

    // ─── Email / password registration (kept for admin + web flows) ─────────────

    async register(dto: RegisterUserDto) {
        if (!dto.email && !dto.phone) {
            throw new BadRequestException('Either an email or a phone number is required.');
        }

        const existing = await this.userRepository.findOne({
            where: [
                ...(dto.email ? [{ email: dto.email }] : []),
                ...(dto.phone ? [{ phone: dto.phone }] : []),
            ],
        });
        if (existing) {
            throw new ConflictException('A user with this identifier already exists.');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = this.userRepository.create({
            email: dto.email ?? null,
            passwordHash,
            fullName: dto.fullName,
            phone: dto.phone ?? null,
            role: 'buyer',           // explicit email/password registration → active buyer by default
            isVerified: !!dto.phone, // treat phone-provided reg as pre-verified
        });

        const savedUser = await this.userRepository.save(user);
        const { accessToken, refreshToken } = await this.issueTokenPair(savedUser);

        // On a long-running server, firing this without awaiting was fine — the
        // process stays alive to finish it. On Vercel (or any serverless host)
        // the function can freeze immediately after the response is sent, so an
        // unawaited promise here would silently never complete. Awaiting trades
        // a bit of latency for actually delivering the email.
        if (savedUser.email) {
            await this.emailService
                .sendRegistrationEmail(savedUser.email, savedUser.fullName)
                .catch(() => {/* already logged inside EmailService */});
        }

        return { user: this.toPublicUser(savedUser), accessToken, refreshToken };
    }

    // ─── Email / password login ──────────────────────────────────────────────────

    async login(dto: LoginUserDto) {
        if (!dto.password) {
            throw new UnauthorizedException('Password is required for this login method.');
        }

        const user = await this.userRepository.findOne({
            where: [{ email: dto.identifier }, { phone: dto.identifier }],
        });
        if (!user || !user.passwordHash) {
            // passwordHash is null on provisional/OTP-only accounts — don't reveal that detail
            throw new UnauthorizedException('Invalid credentials.');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid credentials.');
        }

        // Reject banned/locked accounts at login time too (belt-and-suspenders;
        // JwtStrategy also rejects them on every subsequent request).
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated.');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new UnauthorizedException('Account is temporarily locked.');
        }

        const { accessToken, refreshToken } = await this.issueTokenPair(user);
        return { user: this.toPublicUser(user), accessToken, refreshToken };
    }

    // ─── OTP flow (primary mobile onboarding) ───────────────────────────────────

    async requestPhoneOtp(dto: { phone: string }) {
        const code = this.generateOtp();
        const devMode = this.configService.get<string>('OTP_DEV_MODE', 'false') === 'true';
        await this.otpStore.setOtp(dto.phone, code, 300);

        // Log the OTP to the console in local development only.
        // The code MUST NOT appear in any HTTP response in any environment.
        if (devMode) {
            console.log(`[DEV] OTP for ${dto.phone}: ${code}`);
        }

        // This is the actual OTP delivery, not a side-effect — it must be
        // awaited. Firing it without awaiting works on a long-running server,
        // but on Vercel the function can freeze right after the response is
        // sent, which would silently drop the SMS before Termii ever gets it.
        await this.smsService
            .sendOtp(dto.phone, code, 5)
            .catch(() => {/* SmsService already logs errors internally */});

        return {
            success: true,
            devMode,
            phone: dto.phone,
            expiresIn: 300,
        };
    }

    /**
     * Option C — Provisional auto-register on first OTP verify.
     *
     * - Known phone  → normal login, full-scope token.
     * - Unknown phone → create provisional account, return onboarding token.
     *
     * Provisional tokens carry role='provisional'. Guards on transactional
     * endpoints (ProvisionalGuard / @RequireFullProfile()) block access until
     * POST /auth/profile/setup promotes the account to 'buyer' or 'seller'.
     */
    async verifyPhoneOtp(dto: { phone: string; code: string }) {
        const result = await this.otpStore.verifyOtp(dto.phone, dto.code);
        if (!result.ok) {
            throw new UnauthorizedException(result.locked ? 'OTP locked.' : 'Invalid OTP.');
        }

        let user = await this.userRepository.findOne({ where: { phone: dto.phone } });
        let isNewUser = false;

        if (!user) {
            // First-time phone verification → create a minimal provisional account.
            user = this.userRepository.create({
                phone: dto.phone,
                email: null,
                passwordHash: null,
                fullName: null,
                role: 'provisional',
                isVerified: true,   // phone is verified by OTP
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

    // ─── Profile setup — promotes provisional → buyer | seller ──────────────────

    /**
     * Completes onboarding for a provisional user.
     * After this call the account role becomes 'buyer' or 'seller' and the
     * returned tokens carry the new role — no second login needed.
     */
    async setupProfile(userId: string, dto: SetupProfileDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found.');

        if (user.role !== 'provisional') {
            throw new ForbiddenException('Profile is already complete.');
        }

        user.fullName = dto.fullName;
        user.role = dto.role as UserRole; // 'buyer' | 'seller'
        const savedUser = await this.userRepository.save(user);

        // Revoke old tokens and issue fresh ones with the updated role.
        await this.refreshTokenStore.revokeAllForUser(userId);
        const { accessToken, refreshToken } = await this.issueTokenPair(savedUser);

        return {
            user: this.toPublicUser(savedUser),
            accessToken,
            refreshToken,
            message:
                dto.role === IntendedRole.SELLER
                    ? 'Profile complete. Upload KYC documents at POST /kyc/upload before listing livestock.'
                    : 'Profile complete. You can now browse and purchase livestock.',
        };
    }

    // ─── Token management ────────────────────────────────────────────────────────

    async refreshToken(token: string) {
        const userId = await this.refreshTokenStore.consume(token);
        if (!userId) {
            throw new UnauthorizedException('Invalid or already-used refresh token.');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('Invalid refresh token.');
        }

        const { accessToken, refreshToken } = await this.issueTokenPair(user);
        return { accessToken, refreshToken };
    }

    async validateUser(userId: string) {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    // ─── Internals ───────────────────────────────────────────────────────────────

    private async issueTokenPair(user: User) {
        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(user.id, user.email, user.role),
            this.refreshTokenStore.issue(user.id),
        ]);
        return { accessToken, refreshToken };
    }

    private async signAccessToken(userId: string, email: string | null, role: string) {
        // No inline `secret`/algorithm — relies on RS256 keypair + 15m expiry
        // configured in AuthModule's JwtModule. Passing options here would
        // silently override that configuration.
        return this.jwtService.signAsync({ sub: userId, email, role });
    }

    private generateOtp() {
        // Cryptographically secure, unlike Math.random().
        return randomInt(100000, 1000000).toString();
    }

    private toPublicUser(user: User) {
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
}
