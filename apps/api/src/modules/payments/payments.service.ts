import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreatePaymentDto) {
        const transaction = await this.transactionRepository.findOne({ where: { id: dto.transactionId } });
        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        if (dto.amount <= 0) {
            throw new BadRequestException('Payment amount must be greater than zero');
        }

        const payment = this.paymentRepository.create({
            transactionId: transaction.id,
            amount: dto.amount,
            provider: 'manual',
            status: 'pending',
            reference: `pay-${Date.now()}`,
        });

        const savedPayment = await this.paymentRepository.save(payment);
        await this.auditService.log('payment', 'created', transaction.buyerId, {
            paymentId: savedPayment.id,
            transactionId: transaction.id,
            amount: dto.amount,
        });

        return savedPayment;
    }

    async updateStatus(id: string, status: string) {
        const payment = await this.paymentRepository.findOne({ where: { id } });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        payment.status = status;
        const savedPayment = await this.paymentRepository.save(payment);
        await this.auditService.log('payment', 'status_updated', payment.transactionId, {
            paymentId: savedPayment.id,
            status,
        });

        return savedPayment;
    }
}
