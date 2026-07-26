import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * ProvisionalGuard — blocks users whose role is still 'provisional'.
 *
 * Apply AFTER JwtAuthGuard on any endpoint that requires a completed profile:
 *
 *   @UseGuards(JwtAuthGuard, ProvisionalGuard)
 *   @Post('listings')
 *   create(...) { ... }
 *
 * Provisional users are directed to POST /auth/profile/setup to complete
 * onboarding before accessing transactional features.
 */
@Injectable()
export class ProvisionalGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();

        if (user?.role === 'provisional') {
            throw new ForbiddenException(
                'Complete your profile first. POST /auth/profile/setup with { fullName, role }.',
            );
        }

        return true;
    }
}
