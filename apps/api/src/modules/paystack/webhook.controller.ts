import { BadRequestException, Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EscrowService } from '../escrow/escrow.service';
import { PaymentsService } from '../payments/payments.service';
import { PaystackService } from './paystack.service';
import { EscrowStatus } from '../transactions/entities/transaction.entity';

@ApiTags('webhooks')
@Controller('webhooks/paystack')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        private readonly paystackService: PaystackService,
        private readonly paymentsService: PaymentsService,
        private readonly escrowService: EscrowService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Paystack webhook listener (HMAC-SHA512 verified)' })
    async handleWebhook(
        @Headers('x-paystack-signature') signature: string,
        @Body() payload: any,
    ) {
        if (!this.paystackService.verifyWebhookSignature(signature, payload)) {
            this.logger.error('Invalid Paystack webhook signature');
            throw new BadRequestException('Invalid signature');
        }

        const { event, data } = payload;
        this.logger.log(`Paystack event received: ${event}`);

        switch (event) {
            case 'charge.success':
                await this.handleChargeSuccess(data);
                break;
            case 'transfer.success':
                await this.handleTransferSuccess(data);
                break;
            case 'transfer.failed':
                await this.handleTransferFailed(data);
                break;
            default:
                this.logger.log(`Unhandled Paystack event: ${event}`);
        }

        return { status: 'success' };
    }

    // ─── Event handlers ──────────────────────────────────────────────────────────

    private async handleChargeSuccess(data: any) {
        const { reference, metadata } = data;
        this.logger.log(`charge.success — reference: ${reference}`);

        const transactionId = metadata?.transactionId;
        if (transactionId) {
            // Transition escrow to PAYMENT_HELD so funds are locked.
            await this.escrowService.transitionTo(transactionId, EscrowStatus.PAYMENT_HELD, undefined);
        }
    }

    private async handleTransferSuccess(data: any) {
        this.logger.log(`transfer.success — code: ${data.transfer_code}`);
    }

    private async handleTransferFailed(data: any) {
        this.logger.error(`transfer.failed — code: ${data.transfer_code}, reason: ${data.reason}`);
    }
}
