import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProvisionalGuard } from '../guards/provisional.guard';

/**
 * Shorthand decorator that combines JWT authentication + provisional-user check.
 *
 * Usage (replaces @UseGuards(JwtAuthGuard, ProvisionalGuard)):
 *
 *   @RequireFullProfile()
 *   @Post('listings')
 *   create(...) { ... }
 *
 * Sellers also need KYC approval — apply @Roles('seller') + KycGuard on top
 * of this where listing creation is concerned.
 */
export function RequireFullProfile() {
    return applyDecorators(
        UseGuards(JwtAuthGuard, ProvisionalGuard),
        ApiBearerAuth(),
        ApiForbiddenResponse({
            description: 'Profile incomplete — POST /auth/profile/setup first.',
        }),
    );
}
