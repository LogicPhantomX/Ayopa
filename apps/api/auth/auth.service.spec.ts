import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { OtpStore } from './otp-store';
import { RefreshTokenStore } from './refresh-token-store';

const mockSmsService = {
    sendOtp: jest.fn().mockResolvedValue({ messageId: 'stub' }),
    send: jest.fn().mockResolvedValue({ messageId: 'stub' }),
};

const mockEmailService = {
    sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
    sendOrderPlacedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowFundedEmail: jest.fn().mockResolvedValue(undefined),
    sendDisputeOpenedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowReleasedEmail: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
    let service: AuthService;
    let repository: Repository<User>;
    let module: TestingModule;

    beforeEach(async () => {
        jest.clearAllMocks();
        module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: jest.fn().mockResolvedValue('signed-token'),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string, defaultValue?: string) => defaultValue ?? key),
                    },
                },
                { provide: SmsService, useValue: mockSmsService },
                { provide: EmailService, useValue: mockEmailService },
                // OtpStore and RefreshTokenStore use in-memory fallback when no Redis is
                // configured — they can be real instances rather than mocks.
                OtpStore,
                RefreshTokenStore,
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    it('registers a new user and returns an auth payload', async () => {
        (repository.findOne as jest.Mock).mockResolvedValue(null);
        (repository.create as jest.Mock).mockReturnValue({ id: '1', email: 'test@example.com' });
        (repository.save as jest.Mock).mockResolvedValue({
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            phone: null,
            role: 'user',
            isActive: true,
            isVerified: false,
            createdAt: new Date(),
        });

        const result = await service.register({
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
        });

        expect(result.accessToken).toBe('signed-token');
        expect(result.user.email).toBe('test@example.com');
    });

    it('requests a phone OTP in dev mode — code must NOT appear in the HTTP response', async () => {
        // Configure ConfigService to report dev mode is ON for this test.
        const config = module.get(ConfigService);
        (config.get as jest.Mock).mockImplementation((key: string, defaultValue?: string) => {
            if (key === 'OTP_DEV_MODE') return 'true';
            return defaultValue ?? key;
        });

        const result = await service.requestPhoneOtp({ phone: '+2348000000000' } as any);

        // devMode flag is present so callers know this is a dev environment
        expect(result.devMode).toBe(true);

        // THE FIX: the OTP code must never be returned in any HTTP response,
        // regardless of environment. It is logged to console (dev only) instead.
        expect((result as any).code).toBeUndefined();
    });

    it('sends an SMS via SmsService when OTP is requested', async () => {
        const result = await service.requestPhoneOtp({ phone: '+2348000000000' } as any);
        expect(result.success).toBe(true);
        // SmsService.sendOtp is called (may be async fire-and-forget — give it a tick)
        await Promise.resolve();
        expect(mockSmsService.sendOtp).toHaveBeenCalledWith('+2348000000000', expect.any(String), 5);
    });

    it('does not return the dev-mode OTP code when dev mode is disabled', async () => {
        const config = module.get(ConfigService);
        (config.get as jest.Mock).mockImplementation((key: string, defaultValue?: string) => {
            if (key === 'OTP_DEV_MODE') {
                return 'false';
            }
            return defaultValue ?? key;
        });

        const result = await service.requestPhoneOtp({ phone: '+2348000000000' } as any);
        expect((result as any).code).toBeUndefined();
    });

    it('rejects an old refresh token after rotation', async () => {
        const jwt = module.get(JwtService);
        (jwt as any).decode = jest.fn().mockReturnValue({ sub: 'user-1' });

        const mockUser = { id: 'user-1', email: 'a@example.com', role: 'user' };
        // First call: register() checks for duplicate — must return null.
        // Subsequent calls: refreshToken() looks up user by id — return the user.
        (repository.findOne as jest.Mock)
            .mockResolvedValueOnce(null)       // duplicate check in register()
            .mockResolvedValue(mockUser);      // all subsequent lookups

        (repository.create as jest.Mock).mockReturnValue(mockUser);
        (repository.save as jest.Mock).mockResolvedValue(mockUser);

        const first = await service.register({ email: 'a@example.com', password: 'password123', fullName: 'A' } as any);
        const second = await service.refreshToken(first.refreshToken);

        await expect(service.refreshToken(first.refreshToken)).rejects.toThrow();
        expect(second.refreshToken).toBeDefined();
    });
});
