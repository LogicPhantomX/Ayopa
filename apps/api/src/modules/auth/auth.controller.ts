import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SetupProfileDto } from './dto/setup-profile.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// ── Item 5: Rate limiting ──────────────────────────────────────────────────────
// @Throttle overrides apply ON TOP of the global APP_GUARD default tier.
// 'auth' tier  (20 req / 60 s) — registration, profile setup, token refresh.
// 'otp'  tier  ( 5 req / 60 s) — OTP request, OTP verify, and login; these
//   are the highest-value brute-force targets so they get the tightest limit.

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // ─── Email / password registration ─────────────────────────────────────────

    @Post('register')
    @Throttle({ auth: { ttl: 60_000, limit: 20 } })
    @ApiOperation({ summary: 'Register with email/password (web / admin flows)' })
    @ApiCreatedResponse({ description: 'User registered, tokens issued.' })
    async register(@Body() dto: RegisterUserDto) {
        return this.authService.register(dto);
    }

    // ─── Email / password login ─────────────────────────────────────────────────

    @Post('login')
    @Throttle({ otp: { ttl: 60_000, limit: 5 } })
    @ApiOperation({ summary: 'Login with email or phone + password' })
    @ApiOkResponse({ description: 'Tokens issued.' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
    async login(@Body() dto: LoginUserDto) {
        return this.authService.login(dto);
    }

    // ─── OTP flow ──────────────────────────────────────────────────────────────

    @Post('otp/request')
    @Throttle({ otp: { ttl: 60_000, limit: 5 } })
    @ApiOperation({ summary: 'Send a 6-digit OTP to a Nigerian mobile number' })
    @ApiBody({ schema: { example: { phone: '+2348012345678' } } })
    @ApiOkResponse({ description: 'OTP dispatched (returned in response in dev mode).' })
    async requestOtp(@Body() dto: { phone: string }) {
        return this.authService.requestPhoneOtp(dto);
    }

    @Post('otp/verify')
    @Throttle({ otp: { ttl: 60_000, limit: 5 } })
    @ApiOperation({
        summary: 'Verify OTP — logs in existing users, auto-registers new ones as provisional',
        description:
            'If the phone number is new, a provisional account is created and `isNewUser: true` ' +
            'is returned alongside a `nextStep` hint. Provisional tokens are valid but blocked ' +
            'from transactional endpoints until POST /auth/profile/setup is called.',
    })
    @ApiBody({ schema: { example: { phone: '+2348012345678', code: '123456' } } })
    @ApiOkResponse({ description: 'OTP verified. Tokens issued.' })
    async verifyOtp(@Body() dto: { phone: string; code: string }) {
        return this.authService.verifyPhoneOtp(dto);
    }

    // ─── Profile setup (provisional → buyer | seller) ──────────────────────────

    @Post('profile/setup')
    @Throttle({ auth: { ttl: 60_000, limit: 20 } })
    @UseGuards(JwtAuthGuard)          // must have a valid token (provisional or full)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Complete onboarding — set name and choose buyer or seller role',
        description:
            'Required after OTP registration. Promotes a provisional account to buyer or seller, ' +
            'revokes old tokens, and returns fresh tokens carrying the new role. ' +
            'Sellers must then POST /kyc/upload before their first listing.',
    })
    @ApiBody({ type: SetupProfileDto })
    @ApiOkResponse({ description: 'Profile complete. Fresh tokens issued.' })
    async setupProfile(@Request() req: any, @Body() dto: SetupProfileDto) {
        return this.authService.setupProfile(req.user.id, dto);
    }

    // ─── Token refresh ─────────────────────────────────────────────────────────

    @Post('refresh')
    @Throttle({ auth: { ttl: 60_000, limit: 20 } })
    @ApiOperation({ summary: 'Rotate tokens using a refresh token (single-use)' })
    @ApiBody({ schema: { example: { refreshToken: '<refresh-token>' } } })
    @ApiOkResponse({ description: 'New access + refresh tokens issued.' })
    async refresh(@Body() dto: { refreshToken: string }) {
        return this.authService.refreshToken(dto.refreshToken);
    }
}
