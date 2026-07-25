/**
 * Integration test: Escrow → Dispute → Resolution
 *
 * Exercises the full escrow state machine end-to-end, wiring real
 * EscrowService + real DisputesService together. External side-effects
 * (DB repositories, email, audit log) are mocked so the test needs no
 * live database or SMTP server.
 *
 * Covers:
 *   ✓ Order placed → PAYMENT_HELD (simulated Paystack webhook)
 *   ✓ Seller delivers → FIRST_RELEASED (with 48-h auto-release timer set)
 *   ✓ Buyer raises dispute → DISPUTED (escrow frozen)
 *   ✓ Admin resolves in buyer's favour → REFUNDED
 *   ✓ Admin resolves in seller's favour → COMPLETED
 *   ✓ 48-h auto-release: processAutoReleases() completes FIRST_RELEASED txns
 *   ✗ Invalid state transitions are rejected
 *   ✗ Dispute after auto-release (COMPLETED) is rejected
 *   ✗ Re-resolving an already-resolved dispute is rejected
 *   ✗ Duplicate dispute on the same transaction is rejected
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import { EscrowService } from './escrow.service';
import { DisputesService } from '../disputes/disputes.service';
import { Transaction, EscrowStatus } from '../transactions/entities/transaction.entity';
import { EscrowEvent } from './entities/escrow-event.entity';
import { Dispute } from '../disputes/entities/dispute.entity';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Build a minimal Transaction object at a given status. */
function makeTx(overrides: Partial<Transaction> = {}): Transaction {
    return {
        id: 'tx-001',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        listingId: 'listing-1',
        amount: 200_000,
        currency: 'NGN',
        status: EscrowStatus.CREATED,
        commissionAmount: 10_000,
        firstReleaseAmount: 95_000,
        escrowReleased: false,
        autoReleaseAt: null,
        buyer: { id: 'buyer-1', email: 'buyer@example.com', fullName: 'Buyer Ade' } as any,
        seller: { id: 'seller-1', email: 'seller@example.com', fullName: 'Seller Ngozi' } as any,
        listing: { id: 'listing-1' } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as Transaction;
}

/** Build a minimal Dispute object. */
function makeDispute(txId: string, status = 'open'): Dispute {
    return {
        id: 'dispute-001',
        transactionId: txId,
        initiatorId: 'buyer-1',
        reason: 'Item not as described',
        status,
        responseDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        appealCount: 0,
        resolutionSummary: null,
        sellerResponse: null,
        transaction: {} as any,
        initiator: {} as any,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as Dispute;
}

// ─── Mock factories ───────────────────────────────────────────────────────────

const mockEmail = {
    sendOrderPlacedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowFundedEmail: jest.fn().mockResolvedValue(undefined),
    sendEscrowReleasedEmail: jest.fn().mockResolvedValue(undefined),
    sendDisputeOpenedEmail: jest.fn().mockResolvedValue(undefined),
    sendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
};

const mockAudit = {
    log: jest.fn().mockResolvedValue({}),
};

/**
 * Build a DataSource mock whose transaction() callback delegates to a
 * configurable manager. This lets each test pre-wire findOne/save to return
 * specific objects without touching a real DB.
 */
function makeDataSource(
    txRepo: any,
    disputeRepo: any,
    eventRepo: any,
): jest.Mocked<DataSource> {
    return {
        transaction: jest.fn(async (cb: (manager: any) => Promise<any>) => {
            const manager = {
                findOne: jest.fn(async (Entity: any, opts: any) => {
                    if (Entity === Transaction) return txRepo.findOne(opts);
                    if (Entity === Dispute) return disputeRepo.findOne(opts);
                    return null;
                }),
                save: jest.fn(async (entityOrInstance: any) => {
                    if (entityOrInstance instanceof Object && 'toStatus' in entityOrInstance) {
                        return eventRepo.save(entityOrInstance);
                    }
                    return entityOrInstance;
                }),
                create: jest.fn((EntityClass: any, data: any) => ({ ...data })),
            };
            return cb(manager);
        }),
    } as unknown as jest.Mocked<DataSource>;
}

// ─── Module bootstrap ─────────────────────────────────────────────────────────

interface SetupResult {
    escrowService: EscrowService;
    disputesService: DisputesService;
    txRepo: any;
    disputeRepo: any;
    eventRepo: any;
    dataSource: jest.Mocked<DataSource>;
}

async function bootstrap(initialTx: Transaction): Promise<SetupResult> {
    const txRepo = {
        findOne: jest.fn().mockResolvedValue(initialTx),
        save: jest.fn().mockImplementation(async (t: any) => t),
        create: jest.fn().mockImplementation((data: any) => data),
        createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        })),
    };

    const disputeRepo = {
        findOne: jest.fn(),
        save: jest.fn().mockImplementation(async (d: any) => d),
        create: jest.fn().mockImplementation((data: any) => data),
        createQueryBuilder: jest.fn(() => ({
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        })),
    };

    const eventRepo = {
        create: jest.fn().mockReturnValue({}),
        save: jest.fn().mockResolvedValue({}),
    };

    const dataSource = makeDataSource(txRepo, disputeRepo, eventRepo);

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            EscrowService,
            DisputesService,
            { provide: getRepositoryToken(Transaction), useValue: txRepo },
            { provide: getRepositoryToken(EscrowEvent), useValue: eventRepo },
            { provide: getRepositoryToken(Dispute), useValue: disputeRepo },
            { provide: DataSource, useValue: dataSource },
            { provide: EmailService, useValue: mockEmail },
            { provide: AuditService, useValue: mockAudit },
        ],
    }).compile();

    return {
        escrowService: module.get<EscrowService>(EscrowService),
        disputesService: module.get<DisputesService>(DisputesService),
        txRepo,
        disputeRepo,
        eventRepo,
        dataSource,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Escrow → Dispute → Resolution (integration)', () => {
    beforeEach(() => jest.clearAllMocks());

    // ══════════════════════════════════════════════════════════════════════════
    // HAPPY PATHS
    // ══════════════════════════════════════════════════════════════════════════

    describe('Happy path A — resolve in buyer\'s favour (REFUND)', () => {
        it('full flow: CREATED → PAYMENT_HELD → FIRST_RELEASED → DISPUTED → DISPUTE_RESOLVED → REFUNDED', async () => {
            const tx = makeTx({ status: EscrowStatus.CREATED });
            const { escrowService, disputesService, txRepo, disputeRepo } = await bootstrap(tx);

            // Step 1: Paystack webhook → PAYMENT_HELD
            await escrowService.transitionTo(tx.id, EscrowStatus.PAYMENT_HELD, 'system');
            expect(tx.status).toBe(EscrowStatus.PAYMENT_HELD);

            // Step 2: Seller marks delivered → FIRST_RELEASED (auto-release timer set)
            await escrowService.transitionTo(tx.id, EscrowStatus.FIRST_RELEASED, 'seller-1');
            expect(tx.status).toBe(EscrowStatus.FIRST_RELEASED);
            expect(tx.autoReleaseAt).toBeInstanceOf(Date);
            const autoReleaseIn = tx.autoReleaseAt!.getTime() - Date.now();
            expect(autoReleaseIn).toBeGreaterThan(47 * 60 * 60 * 1000); // ~48h

            // Step 3: Buyer raises dispute → escrow frozen (DISPUTED)
            const openDispute = makeDispute(tx.id);
            disputeRepo.findOne.mockResolvedValue(null); // no existing dispute
            await disputesService.create('buyer-1', {
                transactionId: tx.id,
                reason: 'Item not as described',
            });
            expect(tx.status).toBe(EscrowStatus.DISPUTED);
            expect(tx.autoReleaseAt).toBeNull(); // auto-release frozen

            // Step 4: Admin resolves → DISPUTE_RESOLVED → REFUNDED
            disputeRepo.findOne.mockResolvedValue(openDispute);
            const resolved = await disputesService.resolve(tx.id, 'admin-1', {
                resolution: 'REFUND',
            });

            expect(resolved.status).toBe('resolved');
            expect(resolved.resolutionSummary).toBe('REFUND');
            expect(tx.status).toBe(EscrowStatus.REFUNDED);
            expect(tx.escrowReleased).toBe(true);
            expect(mockAudit.log).toHaveBeenCalledWith('dispute', 'resolved', 'admin-1', expect.any(Object));
        });
    });

    describe('Happy path B — resolve in seller\'s favour (RELEASE / COMPLETE)', () => {
        it('full flow: CREATED → PAYMENT_HELD → DELIVERY_CONFIRMED → DISPUTED → DISPUTE_RESOLVED → COMPLETED', async () => {
            const tx = makeTx({ status: EscrowStatus.CREATED });
            const { escrowService, disputesService, txRepo, disputeRepo } = await bootstrap(tx);

            // Simulate a PAYMENT_HELD → DELIVERY_CONFIRMED path
            await escrowService.transitionTo(tx.id, EscrowStatus.PAYMENT_HELD, 'system');
            await escrowService.transitionTo(tx.id, EscrowStatus.FIRST_RELEASED, 'seller-1');
            await escrowService.transitionTo(tx.id, EscrowStatus.DELIVERY_CONFIRMED, 'buyer-1');
            expect(tx.status).toBe(EscrowStatus.DELIVERY_CONFIRMED);

            // Raise dispute from DELIVERY_CONFIRMED
            disputeRepo.findOne.mockResolvedValue(null);
            await disputesService.create('buyer-1', {
                transactionId: tx.id,
                reason: 'Partial delivery',
            });
            expect(tx.status).toBe(EscrowStatus.DISPUTED);

            // Admin resolves in seller's favour
            const openDispute = makeDispute(tx.id);
            disputeRepo.findOne.mockResolvedValue(openDispute);
            const resolved = await disputesService.resolve(tx.id, 'admin-2', {
                resolution: 'COMPLETED',
            });

            expect(resolved.status).toBe('resolved');
            expect(tx.status).toBe(EscrowStatus.COMPLETED);
            expect(tx.escrowReleased).toBe(true);
        });
    });

    describe('Happy path C — 48-h auto-release', () => {
        it('processAutoReleases() completes FIRST_RELEASED transactions whose timer has elapsed', async () => {
            const pastDate = new Date(Date.now() - 1000); // already expired
            const tx1 = makeTx({ id: 'tx-auto-1', status: EscrowStatus.FIRST_RELEASED, autoReleaseAt: pastDate });
            const tx2 = makeTx({ id: 'tx-auto-2', status: EscrowStatus.FIRST_RELEASED, autoReleaseAt: pastDate });

            const txRepo = {
                findOne: jest.fn().mockImplementation(async (_opts: any) => {
                    // Return whichever transaction is currently being processed
                    return tx1; // simplified — first call is tx1
                }),
                save: jest.fn().mockImplementation(async (t: any) => t),
                create: jest.fn().mockImplementation((data: any) => data),
                createQueryBuilder: jest.fn(() => ({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([tx1, tx2]),
                })),
            };

            // Each call to transitionTo fetches the tx by id — return the right one
            let callCount = 0;
            txRepo.findOne.mockImplementation(async () => {
                // Alternate between tx1 and tx2 for two auto-releases
                return callCount++ < 2 ? tx1 : tx2;
            });

            const disputeRepo = { findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
            const eventRepo = { create: jest.fn().mockReturnValue({}), save: jest.fn().mockResolvedValue({}) };
            const dataSource = makeDataSource(txRepo, disputeRepo, eventRepo);

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    EscrowService,
                    { provide: getRepositoryToken(Transaction), useValue: txRepo },
                    { provide: getRepositoryToken(EscrowEvent), useValue: eventRepo },
                    { provide: DataSource, useValue: dataSource },
                    { provide: EmailService, useValue: mockEmail },
                ],
            }).compile();

            const escrowService = module.get<EscrowService>(EscrowService);
            const released = await escrowService.processAutoReleases();

            // Both tx1 and tx2 were found by the query — both released
            expect(released).toBe(2);
        });

        it('returns 0 when no transactions have elapsed auto-release timers', async () => {
            const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
            const tx = makeTx({ status: EscrowStatus.FIRST_RELEASED, autoReleaseAt: futureDate });

            const txRepo = {
                findOne: jest.fn().mockResolvedValue(tx),
                save: jest.fn(),
                create: jest.fn(),
                createQueryBuilder: jest.fn(() => ({
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    getMany: jest.fn().mockResolvedValue([]), // none eligible
                })),
            };

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    EscrowService,
                    { provide: getRepositoryToken(Transaction), useValue: txRepo },
                    { provide: getRepositoryToken(EscrowEvent), useValue: { create: jest.fn(), save: jest.fn() } },
                    { provide: DataSource, useValue: makeDataSource(txRepo, {}, { create: jest.fn(), save: jest.fn() }) },
                    { provide: EmailService, useValue: mockEmail },
                ],
            }).compile();

            const escrowService = module.get<EscrowService>(EscrowService);
            expect(await escrowService.processAutoReleases()).toBe(0);
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // UNHAPPY PATHS
    // ══════════════════════════════════════════════════════════════════════════

    describe('Unhappy paths — invalid state transitions', () => {
        it('rejects CREATED → COMPLETED (skipping intermediate states)', async () => {
            const tx = makeTx({ status: EscrowStatus.CREATED });
            const { escrowService } = await bootstrap(tx);

            await expect(
                escrowService.transitionTo(tx.id, EscrowStatus.COMPLETED, 'actor-1'),
            ).rejects.toThrow('Invalid escrow transition: CREATED → COMPLETED');
        });

        it('rejects PAYMENT_HELD → COMPLETED (seller cannot self-complete without delivery step)', async () => {
            const tx = makeTx({ status: EscrowStatus.PAYMENT_HELD });
            const { escrowService } = await bootstrap(tx);

            await expect(
                escrowService.transitionTo(tx.id, EscrowStatus.COMPLETED, 'seller-1'),
            ).rejects.toThrow('Invalid escrow transition: PAYMENT_HELD → COMPLETED');
        });

        it('rejects COMPLETED → DISPUTED (dispute after auto-release)', async () => {
            const tx = makeTx({ status: EscrowStatus.COMPLETED, escrowReleased: true });
            const { escrowService } = await bootstrap(tx);

            await expect(
                escrowService.transitionTo(tx.id, EscrowStatus.DISPUTED, 'buyer-1'),
            ).rejects.toThrow('Invalid escrow transition: COMPLETED → DISPUTED');
        });

        it('rejects REFUNDED → COMPLETED (cannot change outcome after refund)', async () => {
            const tx = makeTx({ status: EscrowStatus.REFUNDED, escrowReleased: true });
            const { escrowService } = await bootstrap(tx);

            await expect(
                escrowService.transitionTo(tx.id, EscrowStatus.COMPLETED, 'admin-1'),
            ).rejects.toThrow('Invalid escrow transition: REFUNDED → COMPLETED');
        });

        it('rejects FIRST_RELEASED → PAYMENT_HELD (cannot go backwards)', async () => {
            const tx = makeTx({ status: EscrowStatus.FIRST_RELEASED });
            const { escrowService } = await bootstrap(tx);

            await expect(
                escrowService.transitionTo(tx.id, EscrowStatus.PAYMENT_HELD, 'admin-1'),
            ).rejects.toThrow('Invalid escrow transition: FIRST_RELEASED → PAYMENT_HELD');
        });
    });

    describe('Unhappy paths — dispute rules', () => {
        it('rejects a duplicate dispute on the same transaction', async () => {
            const tx = makeTx({ status: EscrowStatus.PAYMENT_HELD });
            const { disputesService, disputeRepo } = await bootstrap(tx);

            const existingDispute = makeDispute(tx.id);
            disputeRepo.findOne.mockResolvedValue(existingDispute);

            await expect(
                disputesService.create('buyer-1', {
                    transactionId: tx.id,
                    reason: 'Trying to open a second dispute',
                }),
            ).rejects.toThrow('A dispute already exists for this transaction.');
        });

        it('rejects resolving an already-resolved dispute', async () => {
            const tx = makeTx({ status: EscrowStatus.DISPUTED });
            const { disputesService, disputeRepo } = await bootstrap(tx);

            const resolvedDispute = makeDispute(tx.id, 'resolved');
            disputeRepo.findOne.mockResolvedValue(resolvedDispute);

            await expect(
                disputesService.resolve(tx.id, 'admin-1', { resolution: 'REFUND' }),
            ).rejects.toThrow('Dispute is already resolved.');
        });

        it('rejects a refund attempt on an already-resolved (COMPLETED) escrow', async () => {
            // The escrow is already COMPLETED (seller-favour resolution happened first).
            // A second resolve should hit the "already resolved" guard on the dispute.
            const tx = makeTx({ status: EscrowStatus.COMPLETED, escrowReleased: true });
            const { disputesService, disputeRepo } = await bootstrap(tx);

            const resolvedDispute = makeDispute(tx.id, 'resolved');
            disputeRepo.findOne.mockResolvedValue(resolvedDispute);

            await expect(
                disputesService.resolve(tx.id, 'admin-1', { resolution: 'REFUND' }),
            ).rejects.toThrow('Dispute is already resolved.');
        });

        it('allows only one appeal per dispute', async () => {
            const tx = makeTx({ status: EscrowStatus.DISPUTED });
            const { disputesService, disputeRepo } = await bootstrap(tx);

            // First appeal
            const dispute = makeDispute(tx.id);
            dispute.appealCount = 0;
            disputeRepo.findOne.mockResolvedValue(dispute);
            await disputesService.appeal('buyer-1', { disputeId: dispute.id, reason: 'New evidence found' });
            expect(dispute.appealCount).toBe(1);
            expect(dispute.status).toBe('appealed');

            // Second appeal — should be rejected
            disputeRepo.findOne.mockResolvedValue(dispute); // now appealCount=1
            await expect(
                disputesService.appeal('buyer-1', { disputeId: dispute.id, reason: 'Another attempt' }),
            ).rejects.toThrow('Only one appeal is allowed per dispute.');
        });

        it('rejects seller response after the 12-hour deadline', async () => {
            const tx = makeTx({ status: EscrowStatus.DISPUTED });
            const { disputesService, disputeRepo } = await bootstrap(tx);

            const expiredDispute = makeDispute(tx.id);
            expiredDispute.responseDeadline = new Date(Date.now() - 1000); // already past
            disputeRepo.findOne.mockResolvedValue(expiredDispute);

            await expect(
                disputesService.sellerRespond(expiredDispute.id, 'seller-1', 'I delivered everything'),
            ).rejects.toThrow('Seller response window');
        });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SPLIT CALCULATION
    // ══════════════════════════════════════════════════════════════════════════

    describe('Escrow split calculations', () => {
        let escrowService: EscrowService;

        beforeAll(async () => {
            const { escrowService: svc } = await bootstrap(makeTx());
            escrowService = svc;
        });

        it('calculates 50/50 first-release for normal local transactions', () => {
            const { commission, firstRelease } = escrowService.calculateSplits(200_000, false);
            expect(commission).toBeCloseTo(10_000);   // 5%
            expect(firstRelease).toBeCloseTo(95_000); // 50% of net
        });

        it('calculates 40/60 first-release for inter-state transactions', () => {
            const { firstRelease } = escrowService.calculateSplits(200_000, true);
            expect(firstRelease).toBeCloseTo(76_000); // 40% of 190,000
        });

        it('calculates 30/70 first-release for transactions above ₦500,000', () => {
            const { firstRelease } = escrowService.calculateSplits(1_000_000, false);
            expect(firstRelease).toBeCloseTo(285_000); // 30% of 950,000
        });
    });
});
