import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(req: any, dto: CreateTransactionDto): Promise<import("./entities/transaction.entity").Transaction>;
    findAll(req: any): Promise<import("./entities/transaction.entity").Transaction[]>;
    updateStatus(id: string, dto: UpdateTransactionStatusDto): Promise<import("./entities/transaction.entity").Transaction>;
}
