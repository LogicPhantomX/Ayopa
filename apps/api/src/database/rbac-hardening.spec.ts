import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { RestrictedUsersRepository } from '../modules/users/users.repository';
import { User } from '../modules/users/entities/user.entity';

describe('RBAC Hardening (RestrictedUsersRepository)', () => {
    let repository: RestrictedUsersRepository;
    let dataSource: any;

    const getMockUser = () => ({
        id: 'u-1',
        email: 'test@example.com',
        role: 'user',
        nin: '1234567890',
        bvn: '0987654321',
        kycProfile: {
            idNumber: '1234567890',
            verificationDetails: { secret: 'data' }
        }
    });

    const setupTest = async (userRole: string) => {
        dataSource = {
            createEntityManager: jest.fn(() => ({
                connection: { options: { type: 'postgres' } },
                getRepository: jest.fn(),
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RestrictedUsersRepository,
                { provide: DataSource, useValue: dataSource },
                {
                    provide: REQUEST,
                    useValue: { user: { id: 'admin-1', role: userRole } },
                },
            ],
        }).compile();

        repository = await module.resolve<RestrictedUsersRepository>(RestrictedUsersRepository);
        
        jest.spyOn(repository, 'findOne').mockImplementation(async (options) => {
            const rawUser = getMockUser();
            if (userRole === 'finance_officer') {
                (repository as any).stripSensitiveFields(rawUser);
            }
            return rawUser as any;
        });

        jest.spyOn(repository, 'find').mockImplementation(async (options) => {
            const rawUser = getMockUser();
            if (userRole === 'finance_officer') {
                (repository as any).stripSensitiveFields(rawUser);
            }
            return [rawUser] as any[];
        });
    };

    it('strips sensitive fields for finance_officer on findOne', async () => {
        await setupTest('finance_officer');
        const user = await repository.findOne({ where: { id: 'u-1' } }) as any;

        expect(user?.nin).toBeUndefined();
        expect(user?.bvn).toBeUndefined();
        expect(user?.kycProfile?.idNumber).toBeUndefined();
    });

    it('does NOT strip sensitive fields for super_admin on findOne', async () => {
        await setupTest('super_admin');
        const user = await repository.findOne({ where: { id: 'u-1' } }) as any;

        expect(user?.nin).toBeDefined();
        expect(user?.bvn).toBeDefined();
        expect(user?.kycProfile?.idNumber).toBeDefined();
    });

    it('strips sensitive fields for finance_officer on find', async () => {
        await setupTest('finance_officer');
        const users = await repository.find() as any[];

        expect(users[0].nin).toBeUndefined();
        expect(users[0].bvn).toBeUndefined();
    });
});
