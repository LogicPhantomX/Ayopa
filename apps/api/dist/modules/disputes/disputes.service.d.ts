import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EscrowService } from '../escrow/escrow.service';
import { Transaction } from '../transactions/entities/transaction.entity';
import { AppealDisputeDto } from './dto/appeal-dispute.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { Dispute } from './entities/dispute.entity';
export declare class DisputesService {
    private readonly disputeRepository;
    private readonly transactionRepository;
    private readonly escrowService;
    private readonly auditService;
    private readonly dataSource;
    private readonly emailService;
    constructor(disputeRepository: Repository<Dispute>, transactionRepository: Repository<Transaction>, escrowService: EscrowService, auditService: AuditService, dataSource: DataSource, emailService: EmailService);
    create(initiatorId: string, dto: CreateDisputeDto): Promise<Dispute>;
    findAllForUser(userId: string): Promise<Dispute[]>;
    findOne(id: string): Promise<Dispute>;
    update(disputeId: string, dto: UpdateDisputeDto, actorId: string): Promise<Dispute>;
    resolve(disputeId: string, actorId: string, dto: UpdateDisputeDto): Promise<Dispute>;
    appeal(initiatorId: string, dto: AppealDisputeDto): Promise<Dispute>;
    sellerRespond(disputeId: string, sellerId: string, response: string): Promise<Dispute>;
    private notifyDisputeOpened;
}
