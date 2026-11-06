import { DataSource, Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { Transaction, EscrowStatus } from '../transactions/entities/transaction.entity';
import { EscrowEvent } from './entities/escrow-event.entity';
export declare class EscrowService {
    private readonly transactionRepository;
    private readonly escrowEventRepository;
    private readonly dataSource;
    private readonly emailService;
    private readonly logger;
    constructor(transactionRepository: Repository<Transaction>, escrowEventRepository: Repository<EscrowEvent>, dataSource: DataSource, emailService: EmailService);
    calculateSplits(amount: number, isInterState: boolean): {
        firstRelease: number;
        commission: number;
    };
    transitionTo(transactionId: string, toStatus: EscrowStatus, actorId?: string, metadata?: any): Promise<Transaction>;
    processAutoReleases(): Promise<number>;
    private validateTransition;
    private sendEscrowEmail;
}
