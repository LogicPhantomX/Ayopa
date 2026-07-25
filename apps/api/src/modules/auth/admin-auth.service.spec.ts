import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AdminAuthService } from './admin-auth.service';

// Mock otplib to avoid ESM transformation issues in Jest
jest.mock('otplib', () => ({
    TOTP: jest.fn().mockImplementation(() => ({
        generateSecret: jest.fn().mockReturnValue('secret123'),
        toURI: jest.fn().mockReturnValue('otpauth://url'),
        verify: jest.fn().mockResolvedValue(true),
    })),
}));

describe('AdminAuthService', () => {
    let service: AdminAuthService;
    let repository: Repository<User>;
    let module: TestingModule;

    beforeEach(async () => {
        jest.clearAllMocks();
        module = await Test.createTestingModule({
            providers: [
                AdminAuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AdminAuthService>(AdminAuthService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    it('requires TOTP enrollment on first login', async () => {
        const passwordHash = await bcrypt.hash('password123', 1);
        const admin = {
            email: 'admin@example.com',
            passwordHash,
            role: 'admin',
            adminTotpSecret: null,
            failedLoginAttempts: 0,
        };

        (repository.findOne as jest.Mock).mockResolvedValue(admin);

        const result = await service.loginAdmin('admin@example.com', 'password123');

        expect(result.requiresTotp).toBe(true);
        expect(result.enrolling).toBe(true);
        expect(result.totpSecret).toBeDefined();
        expect(repository.save).toHaveBeenCalled();
    });

    it('locks account after 3 failed attempts', async () => {
        const passwordHash = await bcrypt.hash('correct', 1);
        const admin = {
            email: 'admin@example.com',
            passwordHash,
            role: 'admin',
            failedLoginAttempts: 2,
            lockedUntil: null,
        };

        (repository.findOne as jest.Mock).mockResolvedValue(admin);

        await expect(service.loginAdmin('admin@example.com', 'wrong')).rejects.toThrow('Invalid admin credentials');
        expect(admin.failedLoginAttempts).toBe(3);
        expect(admin.lockedUntil).toBeDefined();
    });

    it('verifies TOTP code', async () => {
        const admin = {
            email: 'admin@example.com',
            role: 'admin',
            adminTotpSecret: 'secret',
            failedLoginAttempts: 0,
        };

        (repository.findOne as jest.Mock).mockResolvedValue(admin);

        const result = await service.verifyAdminTotp('admin@example.com', '123456');

        expect(result.success).toBe(true);
        expect(result.verified).toBe(true);
    });
});
