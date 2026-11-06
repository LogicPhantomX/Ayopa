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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisputesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_service_1 = require("../audit/audit.service");
const email_service_1 = require("../email/email.service");
const escrow_service_1 = require("../escrow/escrow.service");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const dispute_entity_1 = require("./entities/dispute.entity");
let DisputesService = class DisputesService {
    disputeRepository;
    transactionRepository;
    escrowService;
    auditService;
    dataSource;
    emailService;
    constructor(disputeRepository, transactionRepository, escrowService, auditService, dataSource, emailService) {
        this.disputeRepository = disputeRepository;
        this.transactionRepository = transactionRepository;
        this.escrowService = escrowService;
        this.auditService = auditService;
        this.dataSource = dataSource;
        this.emailService = emailService;
    }
    async create(initiatorId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const existing = await manager.findOne(dispute_entity_1.Dispute, {
                where: { transactionId: dto.transactionId },
            });
            if (existing) {
                throw new common_1.BadRequestException('A dispute already exists for this transaction.');
            }
            await this.escrowService.transitionTo(dto.transactionId, transaction_entity_1.EscrowStatus.DISPUTED, initiatorId, {
                reason: dto.reason,
            });
            const responseDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
            const dispute = manager.create(dispute_entity_1.Dispute, {
                transactionId: dto.transactionId,
                initiatorId,
                reason: dto.reason,
                status: 'open',
                responseDeadline,
                appealCount: 0,
            });
            const saved = await manager.save(dispute);
            await this.auditService.log('dispute', 'created', initiatorId, {
                disputeId: saved.id,
                transactionId: dto.transactionId,
            });
            await this.notifyDisputeOpened(dto.transactionId, saved.id, dto.reason);
            return saved;
        });
    }
    async findAllForUser(userId) {
        return this.disputeRepository
            .createQueryBuilder('d')
            .leftJoin('d.transaction', 'tx')
            .where('tx.buyer_id = :userId OR tx.seller_id = :userId OR d.initiator_id = :userId', { userId })
            .orderBy('d.createdAt', 'DESC')
            .getMany();
    }
    async findOne(id) {
        const dispute = await this.disputeRepository.findOne({ where: { id } });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found.');
        return dispute;
    }
    async update(disputeId, dto, actorId) {
        const dispute = await this.disputeRepository.findOne({ where: { id: disputeId } });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found.');
        if (dto.status)
            dispute.status = dto.status;
        if (dto.sellerResponse != null)
            dispute.sellerResponse = dto.sellerResponse;
        if (dto.resolution != null)
            dispute.resolutionSummary = dto.resolution;
        const saved = await this.disputeRepository.save(dispute);
        await this.auditService.log('dispute', 'updated', actorId, { disputeId, changes: dto });
        return saved;
    }
    async resolve(disputeId, actorId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const dispute = await manager.findOne(dispute_entity_1.Dispute, { where: { id: disputeId } });
            if (!dispute)
                throw new common_1.NotFoundException('Dispute not found.');
            if (dispute.status === 'resolved') {
                throw new common_1.BadRequestException('Dispute is already resolved.');
            }
            const resolution = dto.resolution ?? 'COMPLETED';
            dispute.status = 'resolved';
            dispute.resolutionSummary = resolution;
            await manager.save(dispute);
            await this.escrowService.transitionTo(dispute.transactionId, transaction_entity_1.EscrowStatus.DISPUTE_RESOLVED, actorId, { resolution });
            const toStatus = resolution === 'REFUND' ? transaction_entity_1.EscrowStatus.REFUNDED : transaction_entity_1.EscrowStatus.COMPLETED;
            await this.escrowService.transitionTo(dispute.transactionId, toStatus, actorId, { resolution });
            await this.auditService.log('dispute', 'resolved', actorId, { disputeId, resolution });
            return dispute;
        });
    }
    async appeal(initiatorId, dto) {
        const dispute = await this.disputeRepository.findOne({
            where: { id: dto.disputeId },
        });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found.');
        if (dispute.appealCount >= 1) {
            throw new common_1.BadRequestException('Only one appeal is allowed per dispute.');
        }
        dispute.appealCount += 1;
        dispute.status = 'appealed';
        const saved = await this.disputeRepository.save(dispute);
        await this.auditService.log('dispute', 'appealed', initiatorId, {
            disputeId: dto.disputeId,
        });
        return saved;
    }
    async sellerRespond(disputeId, sellerId, response) {
        const dispute = await this.disputeRepository.findOne({ where: { id: disputeId } });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found.');
        if (new Date() > dispute.responseDeadline) {
            throw new common_1.BadRequestException('Seller response window (12 hours) has expired.');
        }
        dispute.sellerResponse = response;
        const saved = await this.disputeRepository.save(dispute);
        await this.auditService.log('dispute', 'seller_responded', sellerId, { disputeId });
        return saved;
    }
    async notifyDisputeOpened(transactionId, disputeId, reason) {
        await this.transactionRepository
            .findOne({ where: { id: transactionId }, relations: { buyer: true, seller: true } })
            .then(async (tx) => {
            if (!tx)
                return;
            const emailData = { transactionId, disputeId, reason };
            const promises = [];
            if (tx.buyer?.email) {
                promises.push(this.emailService.sendDisputeOpenedEmail(tx.buyer.email, emailData));
            }
            if (tx.seller?.email) {
                promises.push(this.emailService.sendDisputeOpenedEmail(tx.seller.email, emailData));
            }
            await Promise.allSettled(promises);
        })
            .catch(() => { });
    }
};
exports.DisputesService = DisputesService;
exports.DisputesService = DisputesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dispute_entity_1.Dispute)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        escrow_service_1.EscrowService,
        audit_service_1.AuditService,
        typeorm_2.DataSource,
        email_service_1.EmailService])
], DisputesService);
//# sourceMappingURL=disputes.service.js.map