import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { KycProfile } from './entities/kyc-profile.entity';
import { AuditService } from '../audit/audit.service';

describe('KycService', () => {
    let service: KycService;
    let kycRepo: any;
    let auditService: any;

    beforeEach(async () => {
        kycRepo = {
            create: jest.fn((d) => d),
            save: jest.fn((d) => Promise.resolve({ id: 'k-1', ...d })),
        };
        auditService = {
            log: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KycService,
                { provide: getRepositoryToken(KycProfile), useValue: kycRepo },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        service = module.get<KycService>(KycService);
    });

    describe('issuePar', () => {
        it('logs audit entry on every PAR issuance', async () => {
            const result = await service.issuePar('u-1', 'NIMC');
            expect(result.uploadUrl).toBeDefined();
            expect(auditService.log).toHaveBeenCalledWith('kyc', 'par_issued', 'u-1', { idType: 'NIMC' });
        });
    });

    describe('submitKyc', () => {
        it('rejects if virus is detected', async () => {
            await expect(service.submitKyc('u-1', {
                idType: 'BVN',
                idNumber: '12345',
                bucketPath: 'infected-doc.pdf',
            })).rejects.toThrow('Virus detected');
            
            expect(auditService.log).toHaveBeenCalledWith('kyc', 'virus_detected', 'u-1', expect.any(Object));
        });

        it('saves approved profile for valid ID', async () => {
            const result = await service.submitKyc('u-1', {
                idType: 'BVN',
                idNumber: '12345',
                bucketPath: 'clean-doc.pdf',
            });

            expect(result.status).toBe('approved');
            expect(kycRepo.save).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalledWith('kyc', 'submitted', 'u-1', expect.any(Object));
        });
    });
});
