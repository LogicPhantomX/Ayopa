import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';

// ── Item 5: Rate limiting ──────────────────────────────────────────────────────
// Admin login and TOTP verify get the strictest 'otp' tier (5 req / 60 s).
// The unlock endpoint gets the 'auth' tier (20 req / 60 s) — it's admin-only
// and doesn't directly expose credentials, so a slightly looser limit is fine.

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) { }

    @Post('login')
    @Throttle({ otp: { ttl: 60_000, limit: 5 } })
    @ApiOperation({ summary: 'Step 1: admin email/password login (returns requiresTotp)' })
    @ApiResponse({ status: 200, description: 'Password verified, TOTP step required' })
    async login(@Body() dto: { email: string; password: string }) {
        return this.adminAuthService.loginAdmin(dto.email, dto.password);
    }

    @Post('totp/verify')
    @Throttle({ otp: { ttl: 60_000, limit: 5 } })
    @ApiOperation({ summary: 'Step 2: verify admin TOTP code' })
    @ApiResponse({ status: 200, description: 'TOTP verified' })
    async verifyTotp(@Body() dto: { email: string; code: string }) {
        return this.adminAuthService.verifyAdminTotp(dto.email, dto.code);
    }

    @Post('unlock')
    @Throttle({ auth: { ttl: 60_000, limit: 20 } })
    @ApiOperation({ summary: 'super_admin-only: unlock a locked admin account' })
    @ApiResponse({ status: 200, description: 'Account unlocked' })
    async unlock(@Body() dto: { actorRole: string; targetEmail: string }) {
        // NOTE: actorRole is taken from the request body here only because no auth
        // guard/decorator exists yet in what's been shared. Once a real auth guard
        // is wired up, replace this with the authenticated caller's role pulled
        // from the request (e.g. @CurrentUser() or req.user.role) instead of trusting
        // a client-supplied field — as written this is spoofable.
        return this.adminAuthService.unlockAdmin(dto.actorRole, dto.targetEmail);
    }
}
