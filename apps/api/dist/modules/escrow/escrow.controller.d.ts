import { EscrowService } from './escrow.service';
declare class TransitionDto {
    status: string;
}
export declare class EscrowController {
    private readonly escrowService;
    constructor(escrowService: EscrowService);
    transition(transactionId: string, dto: TransitionDto, req: any): Promise<import("../transactions/entities/transaction.entity").Transaction>;
    autoRelease(): Promise<number>;
}
export {};
