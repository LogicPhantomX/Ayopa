import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

interface JwtPayload {
    sub: string;
    email: string | null;
    role: string;
    iat: number;
    exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // RS256: validate with the public key. Handle keys pasted into
            // env var UIs with literal "\n" instead of real line breaks.
            secretOrKey: configService.get<string>('JWT_PUBLIC_KEY', '').replace(/\\n/g, '\n'),
            algorithms: ['RS256'],
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.validateUser(payload.sub);

        // Deactivated accounts are always rejected.
        if (!user || !user.isActive) {
            throw new UnauthorizedException();
        }

        // Locked accounts are rejected on EVERY request, not just at login.
        // lockedUntil is set by admin-auth lockout (failed TOTP/password attempts)
        // or by any future ban mechanism that sets a future timestamp.
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new UnauthorizedException('Account is temporarily locked.');
        }

        // Provisional accounts are allowed through JwtStrategy — they have a
        // legitimate token issued by verifyPhoneOtp. Enforcement of "full
        // profile required" happens at the endpoint level via ProvisionalGuard
        // / @RequireFullProfile(), NOT here.  Blocking provisional users here
        // would prevent them from ever reaching POST /auth/profile/setup.
        return {
            id: user.id,
            email: user.email,
            role: user.role,           // 'provisional' | 'buyer' | 'seller' | 'admin'
            fullName: user.fullName,
            isProvisional: user.role === 'provisional',
        };
    }
}
