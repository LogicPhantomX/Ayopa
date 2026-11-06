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
var PayoutsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_service_1 = require("../audit/audit.service");
const paystack_service_1 = require("../paystack/paystack.service");
const payout_approval_entity_1 = require("./entities/payout-approval.entity");
const payout_request_entity_1 = require("./entities/payout-request.entity");
const DUAL_APPROVAL_THRESHOLD_KOBO = 50_000_000;
let PayoutsService = PayoutsService_1 = class PayoutsService {
    payoutRequestRepo;
    payoutApprovalRepo;
    paystackService;
    auditService;
    logger = new common_1.Logger(PayoutsService_1.name);
    constructor(payoutRequestRepo, payoutApprovalRepo, paystackService, auditService) {
        this.payoutRequestRepo = payoutRequestRepo;
        this.payoutApprovalRepo = payoutApprovalRepo;
        this.paystackService = paystackService;
        this.auditService = auditService;
    }
    async createPayoutRequest(requestedBy, dto) {
        if (dto.amount <= DUAL_APPROVAL_THRESHOLD_KOBO) {
            const result = await this.paystackService.initiateTransfer({
                amount: dto.amount,
                recipient: dto.recipientCode,
                reason: dto.reason,
            });
            await this.auditService.log('payout', 'executed_directly', requestedBy, {
                recipientCode: dto.recipientCode,
                amount: dto.amount,
                transferCode: result.transfer_code,
            });
            return {
                message: 'Transfer initiated directly (amount ≤ ₦500,000)',
                data: result,
            };
        }
        const request = this.payoutRequestRepo.create({
            recipientCode: dto.recipientCode,
            amount: dto.amount,
            reason: dto.reason,
            requestedBy,
            status: 'pending',
        });
        const saved = await this.payoutRequestRepo.save(request);
        await this.auditService.log('payout', 'request_created', requestedBy, {
            payoutRequestId: saved.id,
            recipientCode: dto.recipientCode,
            amount: dto.amount,
            reason: dto.reason,
        });
        this.logger.log(`Large payout request created: ${saved.id} for ${dto.amount} kobo — awaiting dual approval.`);
        return {
            message: 'Payout request created. Amount exceeds ₦500,000 — two distinct admin approvals required before transfer executes.',
            data: saved,
        };
    }
    async approvePayout(payoutRequestId, adminId, dto) {
        const request = await this.payoutRequestRepo.findOne({
            where: { id: payoutRequestId },
            relations: { approvals: true },
        });
        if (!request) {
            throw new common_1.NotFoundException('Payout request not found.');
        }
        if (request.status !== 'pending') {
            throw new common_1.BadRequestException(`Payout request is already in status '${request.status}' and cannot be approved.`);
        }
        const alreadyApproved = request.approvals.some((a) => a.approvedBy === adminId);
        if (alreadyApproved) {
            throw new common_1.ForbiddenException('You have already approved this payout request. A second approval must come from a different admin.');
        }
        const approval = this.payoutApprovalRepo.create({
            payoutRequestId,
            approvedBy: adminId,
            comment: dto.comment ?? null,
        });
        await this.payoutApprovalRepo.save(approval);
        await this.auditService.log('payout', 'approved', adminId, {
            payoutRequestId,
            comment: dto.comment ?? null,
            approvalCount: request.approvals.length + 1,
        });
        this.logger.log(`Payout ${payoutRequestId} approved by ${adminId} (${request.approvals.length + 1}/2 approvals).`);
        const refreshed = await this.payoutRequestRepo.findOne({
            where: { id: payoutRequestId },
            relations: { approvals: true },
        });
        if (!refreshed) {
            throw new common_1.NotFoundException('Payout request disappeared after approval — contact support.');
        }
        const distinctApprovers = new Set(refreshed.approvals.map((a) => a.approvedBy));
        if (distinctApprovers.size >= 2) {
            return this.executeTransfer(refreshed, adminId);
        }
        return {
            message: `Approval recorded (${distinctApprovers.size}/2). Waiting for one more admin approval.`,
            data: refreshed,
        };
    }
    async rejectPayout(payoutRequestId, adminId, reason) {
        const request = await this.payoutRequestRepo.findOne({
            where: { id: payoutRequestId },
        });
        if (!request)
            throw new common_1.NotFoundException('Payout request not found.');
        if (request.status !== 'pending') {
            throw new common_1.BadRequestException(`Payout request is already in status '${request.status}'.`);
        }
        request.status = 'rejected';
        const saved = await this.payoutRequestRepo.save(request);
        await this.auditService.log('payout', 'rejected', adminId, { payoutRequestId, reason: reason ?? null });
        return saved;
    }
    async findAll(status) {
        const where = status ? { status } : {};
        return this.payoutRequestRepo.find({
            where,
            order: { createdAt: 'DESC' },
            relations: { approvals: true },
        });
    }
    async findOne(id) {
        const req = await this.payoutRequestRepo.findOne({
            where: { id },
            relations: { approvals: true },
        });
        if (!req)
            throw new common_1.NotFoundException('Payout request not found.');
        return req;
    }
    async executeTransfer(request, triggeringAdminId) {
        request.status = 'executing';
        await this.payoutRequestRepo.save(request);
        let transferCode;
        try {
            const result = await this.paystackService.initiateTransfer({
                amount: request.amount,
                recipient: request.recipientCode,
                reason: request.reason,
            });
            transferCode = result.transfer_code;
            request.status = 'completed';
            request.transferCode = transferCode;
        }
        catch (err) {
            this.logger.error(`Paystack transfer failed for payout ${request.id}: ${err?.message}`);
            request.status = 'failed';
        }
        const saved = await this.payoutRequestRepo.save(request);
        await this.auditService.log('payout', request.status === 'completed' ? 'transfer_executed' : 'transfer_failed', triggeringAdminId, {
            payoutRequestId: request.id,
            amount: request.amount,
            recipientCode: request.recipientCode,
            transferCode: transferCode ?? null,
        });
        if (request.status === 'failed') {
            throw new common_1.BadRequestException('Both approvals received but Paystack transfer failed. The request is now marked as failed — retry or contact support.');
        }
        return {
            message: 'Both approvals received. Transfer executed successfully.',
            data: saved,
        };
    }
};
exports.PayoutsService = PayoutsService;
exports.PayoutsService = PayoutsService = PayoutsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payout_request_entity_1.PayoutRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(payout_approval_entity_1.PayoutApproval)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        paystack_service_1.PaystackService,
        audit_service_1.AuditService])
], PayoutsService);
//# sourceMappingURL=payouts.service.js.map