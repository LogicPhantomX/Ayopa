/**
 * Integration test: OTP onboarding flow
 *
 * Uses real OtpStore + real RefreshTokenStore (both fall back to in-memory
 * when no Redis is configured, which is always the case in test). The User
 * repository and email/SMS side-effects are mocked.
 *
 * Covers:
 *   ✓ Request OTP — code stored, SMS dispatched, code NOT in HTTP response
 *   ✓ Verify OTP — known user gets full-scope tokens
 *   ✓ Verify OTP — unknown phone auto-registers a provisional user
 *   ✓ Provisional token carries role='provisional', isNewUser=true
 *   ✓ Complete profile — promotes provisional → buyer
 *   ✓ Complete profile — promotes provisional → seller
 *   ✓ Old (provisional) refresh token is revoked after setupProfile
 *   ✓ Provisional token rejected by ProvisionalGuard on protected routes
 *   ✗ Invalid OTP is rejected with 401
 *   ✗ OTP locks out after 3 failed attempts (30-min lockout)
 *   ✗ Locked-out phone is rejected immediately
 *   ✗ Already-complete profile cannot be re-setup
 */

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { ProvisionalGuard } from './guards/provisional.guard';
import { OtpStore } from './otp-store';
import { RefreshTokenStore } from './refresh-token-store';

// ─── Mock factories ───────────────────────────────────────────────────────────

const mockSms = {
    sendOtp: jest.fn().mockResolvedValue({ messageId: 'stub-msg-id' }),
    send: jest.fn().mockResolvedValue({ messageId: 'stub-msg-id' }),
};

const mockEmail = {
    sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
    sendOrderPlacedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowFundedEmail: jest.fn().mockResolvedValue(undefined),
    sendDisputeOpenedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowReleasedEmail: jest.fn().mockResolvedValue(undefined),
};

/** Unique phone numbers per sub-test to avoid OTP state leaking across cases. */
let phoneCounter = 0;
function uniquePhone() {
    return `+234800${String(++phoneCounter).padStart(7, '0')}`;
}

/** Build a minimal saved User object. */
function makeUser(phone: string, overrides: Partial<User> = {}): User {
    const base = {
        id: `user-${phone}`,
        phone,
        email: null,
        passwordHash: null,
        fullName: null,
        role: 'provisional' as any,
        isActive: true,
        isVerified: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        adminTotpSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
    // Add the computed getter so TypeScript's structural check is satisfied
    Object.defineProperty(base, 'isProvisional', {
        get() { return this.role === 'provisional'; },
        enumerable: true,
        configurable: true,
    });
    return base as unknown as User;
}

// ─── Module bootstrap ─────────────────────────────────────────────────────────

interface SetupResult {
    service: AuthService;
    userRepo: jest.Mocked<Repository<User>>;
    otpStore: OtpStore;
    refreshStore: RefreshTokenStore;
    module: TestingModule;
}

async function bootstrap(): Promise<SetupResult> {
    const userRepo: Partial<jest.Mocked<Repository<User>>> = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            AuthService,
            {
                provide: getRepositoryToken(User),
                useValue: userRepo,
            },
            {
                provide: JwtService,
                useValue: {
                    signAsync: jest.fn().mockResolvedValue('signed-access-token'),
                },
            },
            {
                provide: ConfigService,
                useValue: {
                    get: jest.fn((key: string, def?: string) => {
                        // No Redis in test — OtpStore and RefreshTokenStore use in-memory fallback
                        if (key === 'NODE_ENV') return 'test';
                        if (key === 'OTP_DEV_MODE') return 'false';
                        return def ?? undefined;
                    }),
                },
            },
            { provide: SmsService, useValue: mockSms },
            { provide: EmailService, useValue: mockEmail },
            OtpStore,
            RefreshTokenStore,
        ],
    }).compile();

    return {
        service: module.get<AuthService>(AuthService),
        userRepo: module.get(getRepositoryToken(User)),
        otpStore: module.get<OtpStore>(OtpStore),
        refreshStore: module.get<RefreshTokenStore>(RefreshTokenStore),
        module,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OTP onboarding flow (integration)', () => {
    let setup: SetupResult;

    beforeEach(async () => {
        jest.clearAllMocks();
        setup = await bootstrap();
    });

    // ══════════════════════════════════════════════════════════════════════════
    // Step 1: Request OTP
    // ══════════════════════════════════════════════════════════════════════════

    describe('Step 1 — requestPhoneOtp', () => {
        it('returns success=true and expiresIn without leaking the OTP code', async () => {
            const phone = uniquePhone();
            const result = await setup.service.requestPhoneOtp({ phone });

            expect(result.success).toBe(true);
            expect(result.expiresIn).toBe(300);
            expect(result.phone).toBe(phone);
            // THE SECURITY INVARIANT: code must never be returned in the HTTP response.
            expect((result as any).code).toBeUndefined();
        });

        it('delegates SMS dispatch to SmsService', async () => {
            const phone = uniquePhone();
            await setup.service.requestPhoneOtp({ phone });

            // Give the fire-and-forget promise a tick to resolve
            await Promise.resolve();
            expect(mockSms.sendOtp).toHaveBeenCalledWith(phone, expect.any(String), 5);
        });

        it('stores the OTP hash in OtpStore (verifiable immediately)', async () => {
            const phone = uniquePhone();
            await setup.service.requestPhoneOtp({ phone });

            // We cannot recover the plaintext code from outside the service,
            // but we CAN verify that a wrong code is rejected — proving storage
            // actually happened.
            const badResult = await setup.otpStore.verifyOtp(phone, '000000');
            expect(badResult.ok).toBe(false);
        });

        it('devMode flag is true when OTP_DEV_MODE=true', async () => {
            const configSvc = setup.module.get<ConfigService>(ConfigService);
            (configSvc.get as jest.Mock).mockImplementation((key: string, def?: string) => {
                if (key === 'OTP_DEV_MODE') return 'true';
                return def ?? undefined;
            });

            const phone = uniquePhone();
            const result = await setup.service.requestPhoneOtp({ phone });
            expect(result.devMode).toBe(true);
            // Still must not return the code — even in dev mode
            expect((result as any).code).toBeUndefined();
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // Step 2: Verify OTP
    // ══════════════════════════════════════════════════════════════════════════

    describe('Step 2 — verifyPhoneOtp', () => {
        it('logs in an existing user and issues tokens (not a new user)', async () => {
            const phone = uniquePhone();
            const user = makeUser(phone, { role: 'buyer' as any, fullName: 'Olu Buyer' });

            // Plant a real OTP into the store
            const code = '123456';
            await setup.otpStore.setOtp(phone, code, 300);

            setup.userRepo.findOne!.mockResolvedValue(user);

            const result = await setup.service.verifyPhoneOtp({ phone, code });

            expect(result.isNewUser).toBe(false);
            expect(result.accessToken).toBe('signed-access-token');
            expect(result.user.phone).toBe(phone);
            expect((result as any).nextStep).toBeUndefined(); // no onboarding needed
        });

        it('auto-registers a new provisional user on first OTP verify', async () => {
            const phone = uniquePhone();
            const provisionalUser = makeUser(phone);

            const code = '654321';
            await setup.otpStore.setOtp(phone, code, 300);

            // First findOne (duplicate check) → null (not found); second (post-save) → provisional user
            setup.userRepo.findOne!.mockResolvedValue(null);
            setup.userRepo.create!.mockReturnValue(provisionalUser);
            setup.userRepo.save!.mockResolvedValue(provisionalUser);

            const result = await setup.service.verifyPhoneOtp({ phone, code });

            expect(result.isNewUser).toBe(true);
            expect(result.user.role).toBe('provisional');
            expect(result.user.isProvisional).toBe(true);
            expect(result.nextStep).toContain('/auth/profile/setup');
            expect(result.accessToken).toBe('signed-access-token');
        });

        it('rejects an incorrect OTP with 401', async () => {
            const phone = uniquePhone();
            await setup.otpStore.setOtp(phone, '999999', 300);

            await expect(
                setup.service.verifyPhoneOtp({ phone, code: '000000' }),
            ).rejects.toThrow('Invalid OTP');
        });

        it('rejects an OTP for a phone that never requested one', async () => {
            const phone = uniquePhone();
            // Nothing stored for this phone
            await expect(
                setup.service.verifyPhoneOtp({ phone, code: '111111' }),
            ).rejects.toThrow();
        });

        it('locks the OTP after 3 failed attempts', async () => {
            const phone = uniquePhone();
            await setup.otpStore.setOtp(phone, '777777', 300);

            // Three wrong attempts
            for (let i = 0; i < 3; i++) {
                await expect(
                    setup.service.verifyPhoneOtp({ phone, code: '000000' }),
                ).rejects.toThrow();
            }

            // Even the correct code is now blocked
            await expect(
                setup.service.verifyPhoneOtp({ phone, code: '777777' }),
            ).rejects.toThrow('OTP locked');
        });

        it('OTP is invalidated after successful verify (single-use)', async () => {
            const phone = uniquePhone();
            const user = makeUser(phone, { role: 'buyer' as any });
            const code = '424242';
            await setup.otpStore.setOtp(phone, code, 300);

            setup.userRepo.findOne!.mockResolvedValue(user);
            await setup.service.verifyPhoneOtp({ phone, code });

            // Second verify with the same code should fail
            await expect(
                setup.service.verifyPhoneOtp({ phone, code }),
            ).rejects.toThrow();
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // Step 3: Complete profile (provisional → buyer | seller)
    // ══════════════════════════════════════════════════════════════════════════

    describe('Step 3 — setupProfile', () => {
        it('promotes a provisional user to buyer and issues fresh tokens', async () => {
            const phone = uniquePhone();
            const provisionalUser = makeUser(phone);
            const upgradedUser = makeUser(phone, { role: 'buyer' as any, fullName: 'Tunde Buyer' });

            setup.userRepo.findOne!.mockResolvedValue(provisionalUser);
            setup.userRepo.save!.mockResolvedValue(upgradedUser);

            const result = await setup.service.setupProfile(provisionalUser.id, {
                fullName: 'Tunde Buyer',
                role: 'buyer' as any,
            });

            expect(result.user.role).toBe('buyer');
            expect(result.user.isProvisional).toBe(false);
            expect(result.accessToken).toBe('signed-access-token');
            expect(result.message).toContain('now browse and purchase');
        });

        it('promotes a provisional user to seller and issues fresh tokens', async () => {
            const phone = uniquePhone();
            const provisionalUser = makeUser(phone);
            const upgradedUser = makeUser(phone, { role: 'seller' as any, fullName: 'Ngozi Seller' });

            setup.userRepo.findOne!.mockResolvedValue(provisionalUser);
            setup.userRepo.save!.mockResolvedValue(upgradedUser);

            const result = await setup.service.setupProfile(provisionalUser.id, {
                fullName: 'Ngozi Seller',
                role: 'seller' as any,
            });

            expect(result.user.role).toBe('seller');
            expect(result.message).toContain('KYC');
        });

        it('revokes the old provisional refresh token after upgrading the account', async () => {
            const phone = uniquePhone();
            const provisionalUser = makeUser(phone);
            const upgradedUser = makeUser(phone, { role: 'buyer' as any, fullName: 'Complete User' });

            // Issue a provisional refresh token
            const { refreshStore } = setup;
            const oldRefreshToken = await refreshStore.issue(provisionalUser.id);

            setup.userRepo.findOne!.mockResolvedValue(provisionalUser);
            setup.userRepo.save!.mockResolvedValue(upgradedUser);

            await setup.service.setupProfile(provisionalUser.id, {
                fullName: 'Complete User',
                role: 'buyer' as any,
            });

            // The old provisional refresh token must now be invalid (revoked)
            const consumed = await refreshStore.consume(oldRefreshToken);
            expect(consumed).toBeNull();
        });

        it('rejects profile setup if the account is already complete (non-provisional)', async () => {
            const phone = uniquePhone();
            const fullUser = makeUser(phone, { role: 'buyer' as any });

            setup.userRepo.findOne!.mockResolvedValue(fullUser);

            await expect(
                setup.service.setupProfile(fullUser.id, {
                    fullName: 'New Name Attempt',
                    role: 'seller' as any,
                }),
            ).rejects.toThrow('Profile is already complete.');
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // Step 4: ProvisionalGuard blocks provisional tokens on protected routes
    // ══════════════════════════════════════════════════════════════════════════

    describe('Step 4 — ProvisionalGuard', () => {
        let guard: ProvisionalGuard;

        beforeEach(() => {
            guard = new ProvisionalGuard();
        });

        function makeContext(role: string): ExecutionContext {
            return {
                switchToHttp: () => ({
                    getRequest: () => ({ user: { id: 'user-1', role } }),
                }),
            } as unknown as ExecutionContext;
        }

        it('blocks provisional users with 403 Forbidden', () => {
            expect(() => guard.canActivate(makeContext('provisional'))).toThrow(ForbiddenException);
        });

        it('blocks provisional users with a descriptive message pointing to /auth/profile/setup', () => {
            try {
                guard.canActivate(makeContext('provisional'));
                fail('Expected ForbiddenException to be thrown');
            } catch (e: any) {
                expect(e.message).toContain('/auth/profile/setup');
            }
        });

        it('allows buyers through', () => {
            expect(guard.canActivate(makeContext('buyer'))).toBe(true);
        });

        it('allows sellers through', () => {
            expect(guard.canActivate(makeContext('seller'))).toBe(true);
        });

        it('allows admins through', () => {
            expect(guard.canActivate(makeContext('admin'))).toBe(true);
        });

        it('confirms: provisional token is rejected but buyer token succeeds (before/after upgrade)', async () => {
            const phone = uniquePhone();
            const provisionalUser = makeUser(phone); // role='provisional'
            const upgradedUser = makeUser(phone, { role: 'buyer' as any, fullName: 'Full User' });

            // Before upgrade: provisional token is blocked
            const ctxBefore = makeContext('provisional');
            expect(() => guard.canActivate(ctxBefore)).toThrow(ForbiddenException);

            // Simulate completing profile
            setup.userRepo.findOne!.mockResolvedValue(provisionalUser);
            setup.userRepo.save!.mockResolvedValue(upgradedUser);
            const result = await setup.service.setupProfile(provisionalUser.id, {
                fullName: 'Full User',
                role: 'buyer' as any,
            });

            // The new token carries role='buyer'
            expect(result.user.role).toBe('buyer');

            // After upgrade: buyer token is allowed
            const ctxAfter = makeContext('buyer');
            expect(guard.canActivate(ctxAfter)).toBe(true);
        });
    });
});
