import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EscrowService } from '../escrow/escrow.service';
import { EscrowStatus, Transaction } from '../transactions/entities/transaction.entity';
import { AppealDisputeDto } from './dto/appeal-dispute.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { Dispute } from './entities/dispute.entity';

@Injectable()
export class DisputesService {
    constructor(
        @InjectRepository(Dispute)
        private readonly disputeRepository: Repository<Dispute>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly escrowService: EscrowService,
        private readonly auditService: AuditService,
        private readonly dataSource: DataSource,
        private readonly emailService: EmailService,
    ) { }

    async create(initiatorId: string, dto: CreateDisputeDto) {
        return this.dataSource.transaction(async (manager) => {
            const existing = await manager.findOne(Dispute, {
                where: { transactionId: dto.transactionId },
            });
            if (existing) {
                throw new BadRequestException('A dispute already exists for this transaction.');
            }

            // Freeze escrow immediately
            await this.escrowService.transitionTo(dto.transactionId, EscrowStatus.DISPUTED as any, initiatorId, {
                reason: dto.reason,
            });

            const responseDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12-hour window
            const dispute = manager.create(Dispute, {
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

            // Send email notifications for dispute opened. Awaited (not
            // fire-and-forget) because on Vercel the function can freeze right
            // after the response is sent, silently dropping any pending promise.
            await this.notifyDisputeOpened(dto.transactionId, saved.id, dto.reason);

            return saved;
        });
    }

    async findAllForUser(userId: string) {
        return this.disputeRepository
            .createQueryBuilder('d')
            .leftJoin('d.transaction', 'tx')
            .where('tx.buyer_id = :userId OR tx.seller_id = :userId OR d.initiator_id = :userId', { userId })
            .orderBy('d.createdAt', 'DESC')
            .getMany();
    }

    async findOne(id: string): Promise<Dispute> {
        const dispute = await this.disputeRepository.findOne({ where: { id } });
        if (!dispute) throw new NotFoundException('Dispute not found.');
        return dispute;
    }

    async update(disputeId: string, dto: UpdateDisputeDto, actorId: string) {
        const dispute = await this.disputeRepository.findOne({ where: { id: disputeId } });
        if (!dispute) throw new NotFoundException('Dispute not found.');

        if (dto.status) dispute.status = dto.status;
        if (dto.sellerResponse != null) dispute.sellerResponse = dto.sellerResponse;
        if (dto.resolution != null) dispute.resolutionSummary = dto.resolution;

        const saved = await this.disputeRepository.save(dispute);
        await this.auditService.log('dispute', 'updated', actorId, { disputeId, changes: dto });
        return saved;
    }

    async resolve(
        disputeId: string,
        actorId: string,
        dto: UpdateDisputeDto,
    ) {
        return this.dataSource.transaction(async (manager) => {
            const dispute = await manager.findOne(Dispute, { where: { id: disputeId } });
            if (!dispute) throw new NotFoundException('Dispute not found.');

            if (dispute.status === 'resolved') {
                throw new BadRequestException('Dispute is already resolved.');
            }

            const resolution = dto.resolution ?? 'COMPLETED';
            dispute.status = 'resolved';
            dispute.resolutionSummary = resolution;
            await manager.save(dispute);

            // State machine requires a two-step path:
            // DISPUTED → DISPUTE_RESOLVED → COMPLETED | REFUNDED
            await this.escrowService.transitionTo(
                dispute.transactionId,
                EscrowStatus.DISPUTE_RESOLVED,
                actorId,
                { resolution },
            );
            const toStatus = resolution === 'REFUND' ? EscrowStatus.REFUNDED : EscrowStatus.COMPLETED;
            await this.escrowService.transitionTo(
                dispute.transactionId,
                toStatus,
                actorId,
                { resolution },
            );

            await this.auditService.log('dispute', 'resolved', actorId, { disputeId, resolution });
            return dispute;
        });
    }

    async appeal(initiatorId: string, dto: AppealDisputeDto) {
        const dispute = await this.disputeRepository.findOne({
            where: { id: dto.disputeId },
        });
        if (!dispute) throw new NotFoundException('Dispute not found.');

        if (dispute.appealCount >= 1) {
            throw new BadRequestException('Only one appeal is allowed per dispute.');
        }

        dispute.appealCount += 1;
        dispute.status = 'appealed';
        const saved = await this.disputeRepository.save(dispute);

        await this.auditService.log('dispute', 'appealed', initiatorId, {
            disputeId: dto.disputeId,
        });

        return saved;
    }

    async sellerRespond(disputeId: string, sellerId: string, response: string) {
        const dispute = await this.disputeRepository.findOne({ where: { id: disputeId } });
        if (!dispute) throw new NotFoundException('Dispute not found.');

        if (new Date() > dispute.responseDeadline) {
            throw new BadRequestException('Seller response window (12 hours) has expired.');
        }

        dispute.sellerResponse = response;
        const saved = await this.disputeRepository.save(dispute);

        await this.auditService.log('dispute', 'seller_responded', sellerId, { disputeId });
        return saved;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private async notifyDisputeOpened(
        transactionId: string,
        disputeId: string,
        reason?: string,
    ): Promise<void> {
        // Load the transaction so we can get buyer/seller emails
        await this.transactionRepository
            .findOne({ where: { id: transactionId }, relations: { buyer: true, seller: true } })
            .then(async (tx) => {
                if (!tx) return;
                const emailData = { transactionId, disputeId, reason };

                const promises: Promise<void>[] = [];
                if (tx.buyer?.email) {
                    promises.push(this.emailService.sendDisputeOpenedEmail(tx.buyer.email, emailData));
                }
                if (tx.seller?.email) {
                    promises.push(this.emailService.sendDisputeOpenedEmail(tx.seller.email, emailData));
                }
                await Promise.allSettled(promises);
            })
            .catch(() => {/* email failures are logged inside EmailService */ });
    }
}