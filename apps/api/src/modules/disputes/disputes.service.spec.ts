import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EscrowService } from '../escrow/escrow.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { DisputesService } from './disputes.service';
import { Dispute } from './entities/dispute.entity';

const mockEmailService = {
    sendDisputeOpenedEmail: jest.fn().mockResolvedValue(undefined),
    sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
    sendOrderPlacedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowFundedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowReleasedEmail: jest.fn().mockResolvedValue(undefined),
};

describe('DisputesService', () => {
    let service: DisputesService;
    let disputeRepo: any;
    let transactionRepo: any;
    let escrowService: any;
    let auditService: any;
    let dataSource: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        disputeRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        transactionRepo = {
            findOne: jest.fn().mockResolvedValue(null),
        };

        escrowService = {
            transitionTo: jest.fn().mockResolvedValue({}),
        };

        auditService = {
            log: jest.fn().mockResolvedValue({}),
        };

        dataSource = {
            transaction: jest.fn((cb) =>
                cb({
                    findOne: disputeRepo.findOne,
                    save: disputeRepo.save,
                    create: (entity: any, data: any) => ({ id: 'd-1', ...data }),
                }),
            ),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DisputesService,
                { provide: getRepositoryToken(Dispute), useValue: disputeRepo },
                { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
                { provide: EscrowService, useValue: escrowService },
                { provide: AuditService, useValue: auditService },
                { provide: DataSource, useValue: dataSource },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<DisputesService>(DisputesService);
    });

    describe('create', () => {
        it('freezes escrow and creates a dispute', async () => {
            disputeRepo.findOne.mockResolvedValue(null);
            disputeRepo.save.mockResolvedValue({ id: 'd-1', transactionId: 'tx-1' });

            const result = await service.create('u-1', {
                transactionId: 'tx-1',
                reason: 'item not as described',
            });

            expect(result.id).toBe('d-1');
            expect(escrowService.transitionTo).toHaveBeenCalledWith('tx-1', 'DISPUTED', 'u-1', expect.any(Object));
            expect(disputeRepo.save).toHaveBeenCalled();
        });

        it('rejects if dispute already exists for transaction', async () => {
            disputeRepo.findOne.mockResolvedValue({ id: 'd-1' });

            await expect(service.create('u-1', { transactionId: 'tx-1', reason: 'reason' }))
                .rejects.toThrow('A dispute already exists');
        });
    });

    describe('appeal', () => {
        it('allows first appeal', async () => {
            const dispute = { id: 'd-1', appealCount: 0 };
            disputeRepo.findOne.mockResolvedValue(dispute);
            disputeRepo.save.mockResolvedValue({ ...dispute, appealCount: 1, status: 'appealed' });

            await service.appeal('u-1', { disputeId: 'd-1', reason: 'new evidence' });

            expect(dispute.appealCount).toBe(1);
            expect(disputeRepo.save).toHaveBeenCalled();
        });

        it('rejects second appeal', async () => {
            const dispute = { id: 'd-1', appealCount: 1 };
            disputeRepo.findOne.mockResolvedValue(dispute);

            await expect(service.appeal('u-1', { disputeId: 'd-1', reason: 'reason' }))
                .rejects.toThrow('Only one appeal is allowed');
        });
    });
});
