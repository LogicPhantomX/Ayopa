import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Listing } from '../listings/entities/listing.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { Transaction } from './entities/transaction.entity';
export declare class TransactionsService {
    private readonly transactionRepository;
    private readonly listingRepository;
    private readonly auditService;
    constructor(transactionRepository: Repository<Transaction>, listingRepository: Repository<Listing>, auditService: AuditService);
    create(buyerId: string, dto: CreateTransactionDto): Promise<Transaction>;
    findAllForUser(userId: string): Promise<Transaction[]>;
    updateStatus(id: string, dto: UpdateTransactionStatusDto): Promise<Transaction>;
}
