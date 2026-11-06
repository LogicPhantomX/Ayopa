import { EscrowService } from '../escrow/escrow.service';
import { PaymentsService } from '../payments/payments.service';
import { PaystackService } from './paystack.service';
export declare class WebhookController {
    private readonly paystackService;
    private readonly paymentsService;
    private readonly escrowService;
    private readonly logger;
    constructor(paystackService: PaystackService, paymentsService: PaymentsService, escrowService: EscrowService);
    handleWebhook(signature: string, payload: any): Promise<{
        status: string;
    }>;
    private handleChargeSuccess;
    private handleTransferSuccess;
    private handleTransferFailed;
}
