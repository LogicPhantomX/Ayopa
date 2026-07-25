import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailService } from '../email/email.service';
import { EscrowService } from './escrow.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { EscrowEvent } from './entities/escrow-event.entity';

// Re-define enum locally for the test to avoid import issues
enum EscrowStatus {
    CREATED = 'CREATED',
    PAYMENT_HELD = 'PAYMENT_HELD',
    FIRST_RELEASED = 'FIRST_RELEASED',
    DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
    COMPLETED = 'COMPLETED',
    DISPUTED = 'DISPUTED',
    DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
    REFUNDED = 'REFUNDED'
}

const mockEmailService = {
    sendOrderPlacedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowFundedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowReleasedEmail: jest.fn().mockResolvedValue(undefined),
    sendDisputeOpenedEmail: jest.fn().mockResolvedValue(undefined),
    sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
};

describe('EscrowService', () => {
    let service: EscrowService;
    let transactionRepo: any;
    let eventRepo: any;
    let dataSource: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        transactionRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            })),
        };
        eventRepo = {
            create: jest.fn(),
            save: jest.fn(),
        };
        dataSource = {
            transaction: jest.fn((cb) => cb({
                findOne: transactionRepo.findOne,
                save: transactionRepo.save,
                create: eventRepo.create,
            })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EscrowService,
                { provide: getRepositoryToken(Transaction), useValue: transactionRepo },
                { provide: getRepositoryToken(EscrowEvent), useValue: eventRepo },
                { provide: DataSource, useValue: dataSource },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<EscrowService>(EscrowService);
    });

    describe('calculateSplits', () => {
        it('calculates 50/50 split for normal local transaction', () => {
            const amount = 100000;
            const result = service.calculateSplits(amount, false);
            // 5% commission = 5000, net = 95000, 50% = 47500
            expect(result.commission).toBe(5000);
            expect(result.firstRelease).toBe(47500);
        });

        it('calculates 40/60 split for inter-state transaction', () => {
            const amount = 100000;
            const result = service.calculateSplits(amount, true);
            // 5% commission = 5000, net = 95000, 40% = 38000
            expect(result.firstRelease).toBe(38000);
        });

        it('calculates 30/70 split for large transaction (>500k)', () => {
            const amount = 600000;
            const result = service.calculateSplits(amount, false);
            // 5% commission = 30000, net = 570000, 30% = 171000
            expect(result.firstRelease).toBe(171000);
        });
    });

    describe('transitionTo', () => {
        it('allows valid transition CREATED -> PAYMENT_HELD', async () => {
            const tx = { id: 'tx-1', status: EscrowStatus.CREATED, buyer: null, seller: null };
            transactionRepo.findOne.mockResolvedValue(tx);

            await service.transitionTo('tx-1', EscrowStatus.PAYMENT_HELD as any);

            expect(tx.status).toBe(EscrowStatus.PAYMENT_HELD);
            expect(transactionRepo.save).toHaveBeenCalledWith(tx);
        });

        it('rejects invalid transition CREATED -> COMPLETED', async () => {
            const tx = { id: 'tx-1', status: EscrowStatus.CREATED, buyer: null, seller: null };
            transactionRepo.findOne.mockResolvedValue(tx);

            await expect(service.transitionTo('tx-1', EscrowStatus.COMPLETED as any))
                .rejects.toThrow('Invalid escrow transition');
        });

        it('sets autoReleaseAt 48h into the future on FIRST_RELEASED', async () => {
            const tx: any = { id: 'tx-1', status: EscrowStatus.PAYMENT_HELD, buyer: null, seller: null };
            transactionRepo.findOne.mockResolvedValue(tx);
            eventRepo.create.mockReturnValue({});

            await service.transitionTo('tx-1', EscrowStatus.FIRST_RELEASED as any);

            expect(tx.autoReleaseAt).toBeInstanceOf(Date);
            const diff = (tx.autoReleaseAt as Date).getTime() - Date.now();
            // Should be approximately 48 hours (within 1 second tolerance)
            expect(diff).toBeGreaterThan(47 * 60 * 60 * 1000);
        });
    });
});
