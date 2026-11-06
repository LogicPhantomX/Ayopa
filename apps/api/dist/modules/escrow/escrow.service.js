"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EscrowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_service_1 = require("../email/email.service");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const escrow_event_entity_1 = require("./entities/escrow-event.entity");
let EscrowService = EscrowService_1 = class EscrowService {
    transactionRepository;
    escrowEventRepository;
    dataSource;
    emailService;
    logger = new common_1.Logger(EscrowService_1.name);
    constructor(transactionRepository, escrowEventRepository, dataSource, emailService) {
        this.transactionRepository = transactionRepository;
        this.escrowEventRepository = escrowEventRepository;
        this.dataSource = dataSource;
        this.emailService = emailService;
    }
    calculateSplits(amount, isInterState) {
        const commissionRate = 0.05;
        const commission = amount * commissionRate;
        const netAmount = amount - commission;
        let firstReleaseRatio = 0.5;
        if (amount > 500_000) {
            firstReleaseRatio = 0.3;
        }
        else if (isInterState) {
            firstReleaseRatio = 0.4;
        }
        return { firstRelease: netAmount * firstReleaseRatio, commission };
    }
    async transitionTo(transactionId, toStatus, actorId, metadata) {
        return this.dataSource.transaction(async (manager) => {
            const transaction = await manager.findOne(transaction_entity_1.Transaction, {
                where: { id: transactionId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!transaction) {
                throw new common_1.BadRequestException('Transaction not found');
            }
            const fromStatus = transaction.status;
            this.validateTransition(fromStatus, toStatus);
            transaction.status = toStatus;
            if (toStatus === 'FIRST_RELEASED') {
                transaction.autoReleaseAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
            }
            else if (toStatus === 'COMPLETED' || toStatus === 'REFUNDED') {
                transaction.escrowReleased = true;
                transaction.autoReleaseAt = null;
            }
            else if (toStatus === 'DISPUTED') {
                transaction.autoReleaseAt = null;
            }
            await manager.save(transaction);
            const event = manager.create(escrow_event_entity_1.EscrowEvent, {
                transactionId,
                fromStatus,
                toStatus,
                actorId,
                metadata,
            });
            await manager.save(event);
            this.logger.log(`[escrow] ${transactionId}: ${fromStatus} → ${toStatus}`);
            await this.sendEscrowEmail(transaction, toStatus).catch(() => { });
            return transaction;
        });
    }
    async processAutoReleases() {
        const now = new Date();
        const pending = await this.transactionRepository
            .createQueryBuilder('t')
            .where('t.status = :status', { status: 'FIRST_RELEASED' })
            .andWhere('t.autoReleaseAt <= :now', { now })
            .getMany();
        for (const tx of pending) {
            try {
                await this.transitionTo(tx.id, 'COMPLETED', undefined, {
                    reason: 'auto_release_48h',
                });
            }
            catch (e) {
                this.logger.error(`Auto-release failed for ${tx.id}: ${e}`);
            }
        }
        return pending.length;
    }
    validateTransition(from, to) {
        const allowed = {
            CREATED: ['PAYMENT_HELD'],
            PAYMENT_HELD: ['FIRST_RELEASED', 'DISPUTED'],
            FIRST_RELEASED: ['DELIVERY_CONFIRMED', 'DISPUTED', 'COMPLETED'],
            DELIVERY_CONFIRMED: ['COMPLETED', 'DISPUTED'],
            DISPUTED: ['DISPUTE_RESOLVED'],
            DISPUTE_RESOLVED: ['COMPLETED', 'REFUNDED'],
            COMPLETED: [],
            REFUNDED: [],
        };
        if (!allowed[from]?.includes(to)) {
            throw new common_1.BadRequestException(`Invalid escrow transition: ${from} → ${to}`);
        }
    }
    async sendEscrowEmail(transaction, toStatus) {
        let tx = transaction;
        if (!tx.buyer || !tx.seller) {
            const loaded = await this.transactionRepository.findOne({
                where: { id: transaction.id },
            });
            if (!loaded)
                return;
            tx = loaded;
        }
        const amountKobo = Number(tx.amount) * 100;
        switch (toStatus) {
            case 'PAYMENT_HELD':
                if (tx.buyer?.email) {
                    await this.emailService.sendOrderPlacedEmail(tx.buyer.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                    }).catch(() => { });
                }
                if (tx.seller?.email) {
                    await this.emailService.sendEscrowFundedEmail(tx.seller.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                        sellerName: tx.seller.fullName,
                    }).catch(() => { });
                }
                break;
            case 'COMPLETED':
                if (tx.seller?.email) {
                    await this.emailService.sendEscrowReleasedEmail(tx.seller.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                        recipientName: tx.seller.fullName,
                    }).catch(() => { });
                }
                if (tx.buyer?.email) {
                    await this.emailService.sendEscrowReleasedEmail(tx.buyer.email, {
                        transactionId: tx.id,
                        amount: amountKobo,
                        currency: tx.currency,
                        recipientName: tx.seller.fullName,
                    }).catch(() => { });
                }
                break;
            default:
                break;
        }
    }
};
exports.EscrowService = EscrowService;
exports.EscrowService = EscrowService = EscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(escrow_event_entity_1.EscrowEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        email_service_1.EmailService])
], EscrowService);
//# sourceMappingURL=escrow.service.js.map