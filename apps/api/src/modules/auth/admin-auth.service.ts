import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { NobleCryptoPlugin, ScureBase32Plugin, TOTP } from 'otplib';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshTokenStore } from './refresh-token-store';

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 30 * 60 * 1000;

@Injectable()
export class AdminAuthService {
    private readonly totp: TOTP;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly refreshTokenStore: RefreshTokenStore,
    ) {
        this.totp = new TOTP({ crypto: new NobleCryptoPlugin(), base32: new ScureBase32Plugin() });
    }

    async loginAdmin(email: string, password: string) {
        const user = await this.findAdminOrThrow(email);
        this.assertNotLocked(user);

        const matches = await bcrypt.compare(password, user.passwordHash);
        if (!matches) {
            await this.registerFailure(user);
            throw new UnauthorizedException('Invalid admin credentials.');
        }

        if (!user.adminTotpSecret) {
            // First-time admin login: issue a fresh TOTP secret to enroll.
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

    async verifyAdminTotp(email: string, code: string) {
        const user = await this.findAdminOrThrow(email);
        this.assertNotLocked(user);

        if (!user.adminTotpSecret) {
            throw new UnauthorizedException('TOTP is not enrolled for this admin.');
        }

        // v13: verify() resolves to { valid, delta, epoch, ... } — not a bare
        // boolean. Checking truthiness of the whole object would always pass,
        // since even { valid: false } is a truthy object.
        const result = await this.totp.verify(code, { secret: user.adminTotpSecret });
        if (!result.valid) {
            await this.registerFailure(user);
            return { success: false, verified: false };
        }

        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.userRepository.save(user);

        // Password + TOTP are both verified — actually log the admin in.
        // (Previously this returned `verified: true` with no tokens, leaving
        // the admin unable to call any bearer-protected admin/* endpoint.)
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

    /** Manual unlock, callable only by a super_admin — enforce the role check at the controller/guard layer too. */
    async unlockAdmin(actorRole: string, targetEmail: string) {
        if (actorRole !== 'super_admin') {
            throw new ForbiddenException('Only a super_admin can unlock an admin account.');
        }

        const user = await this.findAdminOrThrow(targetEmail);
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        await this.userRepository.save(user);

        return { success: true, email: targetEmail };
    }

    private async findAdminOrThrow(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            throw new UnauthorizedException('Invalid admin credentials.');
        }
        return user;
    }

    private assertNotLocked(user: User) {
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
            throw new UnauthorizedException('Admin account is locked. Contact a super_admin to unlock.');
        }
    }

    private async registerFailure(user: User) {
        const attempts = user.failedLoginAttempts + 1;
        user.failedLoginAttempts = attempts;

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
        }

        await this.userRepository.save(user);
    }
}
