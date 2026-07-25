import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Listing } from '../listings/entities/listing.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { Transaction, EscrowStatus } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Listing)
        private readonly listingRepository: Repository<Listing>,
        private readonly auditService: AuditService,
    ) { }

    async create(buyerId: string, dto: CreateTransactionDto) {
        const listing = await this.listingRepository.findOne({ where: { id: dto.listingId } });
        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        const transaction = this.transactionRepository.create({
            buyerId,
            sellerId: listing.sellerId,
            listingId: listing.id,
            amount: dto.amount,
            currency: 'NGN',
            status: EscrowStatus.CREATED,
        });

        const savedTransaction = await this.transactionRepository.save(transaction);
        await this.auditService.log('transaction', 'created', buyerId, {
            transactionId: savedTransaction.id,
            listingId: listing.id,
            amount: dto.amount,
        });

        return savedTransaction;
    }

    async findAllForUser(userId: string) {
        return this.transactionRepository.find({
            where: [{ buyerId: userId }, { sellerId: userId }],
            order: { createdAt: 'DESC' },
        });
    }

    async updateStatus(id: string, dto: UpdateTransactionStatusDto) {
        const transaction = await this.transactionRepository.findOne({ where: { id } });
        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        transaction.status = dto.status as EscrowStatus;
        transaction.escrowReleased = dto.status === EscrowStatus.COMPLETED;
        const savedTransaction = await this.transactionRepository.save(transaction);
        await this.auditService.log('transaction', 'status_updated', undefined, {
            transactionId: savedTransaction.id,
            status: dto.status,
        });

        return savedTransaction;
    }
}
