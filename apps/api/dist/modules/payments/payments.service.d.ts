import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';
export declare class PaymentsService {
    private readonly paymentRepository;
    private readonly transactionRepository;
    private readonly auditService;
    constructor(paymentRepository: Repository<Payment>, transactionRepository: Repository<Transaction>, auditService: AuditService);
    create(dto: CreatePaymentDto): Promise<Payment>;
    updateStatus(id: string, status: string): Promise<Payment>;
}
