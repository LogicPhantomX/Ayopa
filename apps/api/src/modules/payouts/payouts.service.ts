import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { PaystackService } from '../paystack/paystack.service';
import { ApprovePayoutDto } from './dto/approve-payout.dto';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { PayoutApproval } from './entities/payout-approval.entity';
import { PayoutRequest, PayoutStatus } from './entities/payout-request.entity';

/** Amounts above this threshold (in kobo) require dual-admin approval. */
const DUAL_APPROVAL_THRESHOLD_KOBO = 50_000_000; // ₦500,000

@Injectable()
export class PayoutsService {
    private readonly logger = new Logger(PayoutsService.name);

    constructor(
        @InjectRepository(PayoutRequest)
        private readonly payoutRequestRepo: Repository<PayoutRequest>,
        @InjectRepository(PayoutApproval)
        private readonly payoutApprovalRepo: Repository<PayoutApproval>,
        private readonly paystackService: PaystackService,
        private readonly auditService: AuditService,
    ) {}

    // ─── Create ───────────────────────────────────────────────────────────────────

    /**
     * Initiate a payout.
     *
     * - Amounts ≤ ₦500,000 → execute immediately via Paystack.
     * - Amounts > ₦500,000 → create a PayoutRequest that requires 2 distinct
     *   admin approvals before the transfer is executed.
     */
    async createPayoutRequest(
        requestedBy: string,
        dto: CreatePayoutRequestDto,
    ): Promise<{ message: string; data: PayoutRequest | any }> {
        if (dto.amount <= DUAL_APPROVAL_THRESHOLD_KOBO) {
            // Small payout — execute directly
            const result = await this.paystackService.initiateTransfer({
                amount: dto.amount,
                recipient: dto.recipientCode,
                reason: dto.reason,
            });

            await this.auditService.log(
                'payout',
                'executed_directly',
                requestedBy,
                {
                    recipientCode: dto.recipientCode,
                    amount: dto.amount,
                    transferCode: result.transfer_code,
                },
            );

            return {
                message: 'Transfer initiated directly (amount ≤ ₦500,000)',
                data: result,
            };
        }

        // Large payout — requires dual approval
        const request = this.payoutRequestRepo.create({
            recipientCode: dto.recipientCode,
            amount: dto.amount,
            reason: dto.reason,
            requestedBy,
            status: 'pending',
        });

        const saved = await this.payoutRequestRepo.save(request);

        await this.auditService.log(
            'payout',
            'request_created',
            requestedBy,
            {
                payoutRequestId: saved.id,
                recipientCode: dto.recipientCode,
                amount: dto.amount,
                reason: dto.reason,
            },
        );

        this.logger.log(
            `Large payout request created: ${saved.id} for ${dto.amount} kobo — awaiting dual approval.`,
        );

        return {
            message:
                'Payout request created. Amount exceeds ₦500,000 — two distinct admin approvals required before transfer executes.',
            data: saved,
        };
    }

    // ─── Approve ──────────────────────────────────────────────────────────────────

    /**
     * Record one admin approval for a pending payout request.
     *
     * Rules:
     *  - Request must be in `pending` status.
     *  - Each admin may only approve once per request.
     *  - When the second distinct approval arrives, the transfer is executed immediately.
     */
    async approvePayout(
        payoutRequestId: string,
        adminId: string,
        dto: ApprovePayoutDto,
    ): Promise<{ message: string; data: PayoutRequest }> {
        const request = await this.payoutRequestRepo.findOne({
            where: { id: payoutRequestId },
            relations: { approvals: true },
        });

        if (!request) {
            throw new NotFoundException('Payout request not found.');
        }

        if (request.status !== 'pending') {
            throw new BadRequestException(
                `Payout request is already in status '${request.status}' and cannot be approved.`,
            );
        }

        // Check this admin hasn't already approved.
        const alreadyApproved = request.approvals.some(
            (a) => a.approvedBy === adminId,
        );
        if (alreadyApproved) {
            throw new ForbiddenException(
                'You have already approved this payout request. A second approval must come from a different admin.',
            );
        }

        // Record the approval.
        const approval = this.payoutApprovalRepo.create({
            payoutRequestId,
            approvedBy: adminId,
            comment: dto.comment ?? null,
        });
        await this.payoutApprovalRepo.save(approval);

        // Log each approval action to the audit log.
        await this.auditService.log(
            'payout',
            'approved',
            adminId,
            {
                payoutRequestId,
                comment: dto.comment ?? null,
                approvalCount: request.approvals.length + 1,
            },
        );

        this.logger.log(
            `Payout ${payoutRequestId} approved by ${adminId} (${request.approvals.length + 1}/2 approvals).`,
        );

        // Reload to get updated approvals list.
        const refreshed = await this.payoutRequestRepo.findOne({
            where: { id: payoutRequestId },
            relations: { approvals: true },
        });

        if (!refreshed) {
            throw new NotFoundException('Payout request disappeared after approval — contact support.');
        }

        const distinctApprovers = new Set(refreshed.approvals.map((a) => a.approvedBy));

        if (distinctApprovers.size >= 2) {
            // We have the required 2 distinct approvals — execute the transfer.
            return this.executeTransfer(refreshed, adminId);
        }

        return {
            message: `Approval recorded (${distinctApprovers.size}/2). Waiting for one more admin approval.`,
            data: refreshed,
        };
    }

    // ─── Reject ───────────────────────────────────────────────────────────────────

    async rejectPayout(
        payoutRequestId: string,
        adminId: string,
        reason?: string,
    ): Promise<PayoutRequest> {
        const request = await this.payoutRequestRepo.findOne({
            where: { id: payoutRequestId },
        });

        if (!request) throw new NotFoundException('Payout request not found.');

        if (request.status !== 'pending') {
            throw new BadRequestException(
                `Payout request is already in status '${request.status}'.`,
            );
        }

        request.status = 'rejected';
        const saved = await this.payoutRequestRepo.save(request);

        await this.auditService.log(
            'payout',
            'rejected',
            adminId,
            { payoutRequestId, reason: reason ?? null },
        );

        return saved;
    }

    // ─── List ─────────────────────────────────────────────────────────────────────

    async findAll(status?: PayoutStatus) {
        const where = status ? { status } : {};
        return this.payoutRequestRepo.find({
            where,
            order: { createdAt: 'DESC' },
            relations: { approvals: true },
        });
    }

    async findOne(id: string): Promise<PayoutRequest> {
        const req = await this.payoutRequestRepo.findOne({
            where: { id },
            relations: { approvals: true },
        });
        if (!req) throw new NotFoundException('Payout request not found.');
        return req;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────────

    private async executeTransfer(
        request: PayoutRequest,
        triggeringAdminId: string,
    ): Promise<{ message: string; data: PayoutRequest }> {
        request.status = 'executing';
        await this.payoutRequestRepo.save(request);

        let transferCode: string | undefined;
        try {
            const result = await this.paystackService.initiateTransfer({
                amount: request.amount,
                recipient: request.recipientCode,
                reason: request.reason,
            });
            transferCode = result.transfer_code;
            request.status = 'completed';
            request.transferCode = transferCode;
        } catch (err: any) {
            this.logger.error(
                `Paystack transfer failed for payout ${request.id}: ${err?.message}`,
            );
            request.status = 'failed';
        }

        const saved = await this.payoutRequestRepo.save(request);

        await this.auditService.log(
            'payout',
            request.status === 'completed' ? 'transfer_executed' : 'transfer_failed',
            triggeringAdminId,
            {
                payoutRequestId: request.id,
                amount: request.amount,
                recipientCode: request.recipientCode,
                transferCode: transferCode ?? null,
            },
        );

        if (request.status === 'failed') {
            throw new BadRequestException(
                'Both approvals received but Paystack transfer failed. The request is now marked as failed — retry or contact support.',
            );
        }

        return {
            message: 'Both approvals received. Transfer executed successfully.',
            data: saved,
        };
    }
}