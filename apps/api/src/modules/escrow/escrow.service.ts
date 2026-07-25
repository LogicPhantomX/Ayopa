import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { Transaction, EscrowStatus } from '../transactions/entities/transaction.entity';
import { EscrowEvent } from './entities/escrow-event.entity';

@Injectable()
export class EscrowService {
    private readonly logger = new Logger(EscrowService.name);

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(EscrowEvent)
        private readonly escrowEventRepository: Repository<EscrowEvent>,
        private readonly dataSource: DataSource,
        private readonly emailService: EmailService,
    ) {}

    /**
     * Calculates split ratio and platform commission for a transaction.
     * 50/50 local · 40/60 inter-state · 30/70 for transactions > ₦500,000.
     */
    calculateSplits(amount: number, isInterState: boolean): { firstRelease: number; commission: number } {
        const commissionRate = 0.05; // 5% flat
        const commission = amount * commissionRate;
        const netAmount = amount - commission;

        let firstReleaseRatio = 0.5;
        if (amount > 500_000) {
            firstReleaseRatio = 0.3;
        } else if (isInterState) {
            firstReleaseRatio = 0.4;
        }

        return { firstRelease: netAmount * firstReleaseRatio, commission };
    }

    async transitionTo(
        transactionId: string,
        toStatus: EscrowStatus,
        actorId?: string,
        metadata?: any,
    ) {
        return this.dataSource.transaction(async (manager) => {
            const transaction = await manager.findOne(Transaction, {
                where: { id: transactionId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!transaction) {
                throw new BadRequestException('Transaction not found');
            }

            const fromStatus = transaction.status;
            this.validateTransition(fromStatus, toStatus);

            transaction.status = toStatus;

            if (toStatus === 'FIRST_RELEASED') {
                transaction.autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
            } else if (toStatus === 'COMPLETED' || toStatus === 'REFUNDED') {
                transaction.escrowReleased = true;
                transaction.autoReleaseAt = null;
            } else if (toStatus === 'DISPUTED') {
                transaction.autoReleaseAt = null; // freeze auto-release
            }

            await manager.save(transaction);

            const event = manager.create(EscrowEvent, {
                transactionId,
                fromStatus,
                toStatus,
                actorId,
                metadata,
            });
            await manager.save(event);

            this.logger.log(`[escrow] ${transactionId}: ${fromStatus} → ${toStatus}`);

            // Fire transactional emails for key escrow state changes.
            // Awaited (not fire-and-forget): on Vercel the function can freeze
            // right after the response is sent, silently dropping this email.
            // Failures inside sendEscrowEmail are still caught and logged, not
            // re-thrown, so this can't turn an email hiccup into a 500.
            await this.sendEscrowEmail(transaction, toStatus).catch(() => {});

            return transaction;
        });
    }

    /** Cron job target: auto-complete FIRST_RELEASED transactions older than 48 hours. */
    async processAutoReleases() {
        const now = new Date();
        const pending = await this.transactionRepository
            .createQueryBuilder('t')
            .where('t.status = :status', { status: 'FIRST_RELEASED' })
            .andWhere('t.autoReleaseAt <= :now', { now })
            .getMany();

        for (const tx of pending) {
            try {
                await this.transitionTo(tx.id, 'COMPLETED' as EscrowStatus, undefined, {
                    reason: 'auto_release_48h',
                });
            } catch (e) {
                this.logger.error(`Auto-release failed for ${tx.id}: ${e}`);
            }
        }
        return pending.length;
    }

    // ─── State machine ────────────────────────────────────────────────────────────

    private validateTransition(from: string, to: string) {
        const allowed: Record<string, string[]> = {
            CREATED:              ['PAYMENT_HELD'],
            PAYMENT_HELD:         ['FIRST_RELEASED', 'DISPUTED'],
            FIRST_RELEASED:       ['DELIVERY_CONFIRMED', 'DISPUTED', 'COMPLETED'],
            DELIVERY_CONFIRMED:   ['COMPLETED', 'DISPUTED'],
            DISPUTED:             ['DISPUTE_RESOLVED'],
            DISPUTE_RESOLVED:     ['COMPLETED', 'REFUNDED'],
            COMPLETED:            [],
            REFUNDED:             [],
        };

        if (!allowed[from]?.includes(to)) {
            throw new BadRequestException(
                `Invalid escrow transition: ${from} → ${to}`,
            );
        }
    }

    // ─── Email helpers ────────────────────────────────────────────────────────────

    private async sendEscrowEmail(
        transaction: Transaction,
        toStatus: EscrowStatus,
    ): Promise<void> {
        // Eager-loaded relations may or may not be present depending on how
        // the transaction was fetched inside the DB transaction. Reload if needed.
        let tx = transaction;
        if (!tx.buyer || !tx.seller) {
            const loaded = await this.transactionRepository.findOne({
                where: { id: transaction.id },
            });
            if (!loaded) return;
            tx = loaded;
        }

        const amountKobo = Number(tx.amount) * 100; // amount stored in naira → convert to kobo for display

        switch (toStatus) {
            case 'PAYMENT_HELD':
                // Notify buyer (order placed) and seller (escrow funded)
                if (tx.buyer?.email) {
                    await this.emailService.sendOrderPlacedEmail(tx.buyer.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                    }).catch(() => {});
                }
                if (tx.seller?.email) {
                    await this.emailService.sendEscrowFundedEmail(tx.seller.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                        sellerName: tx.seller.fullName,
                    }).catch(() => {});
                }
                break;

            case 'COMPLETED':
                // Escrow released — notify seller (primary recipient)
                if (tx.seller?.email) {
                    await this.emailService.sendEscrowReleasedEmail(tx.seller.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                        recipientName: tx.seller.fullName,
                    }).catch(() => {});
                }
                // Also notify buyer that the transaction is complete
                if (tx.buyer?.email) {
                    await this.emailService.sendEscrowReleasedEmail(tx.buyer.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                        recipientName: tx.seller.fullName,
                    }).catch(() => {});
                }
                break;

            default:
                // No email for other transitions
                break;
        }
    }
}
