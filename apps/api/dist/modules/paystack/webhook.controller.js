"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const escrow_service_1 = require("../escrow/escrow.service");
const payments_service_1 = require("../payments/payments.service");
const paystack_service_1 = require("./paystack.service");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
let WebhookController = WebhookController_1 = class WebhookController {
    paystackService;
    paymentsService;
    escrowService;
    logger = new common_1.Logger(WebhookController_1.name);
    constructor(paystackService, paymentsService, escrowService) {
        this.paystackService = paystackService;
        this.paymentsService = paymentsService;
        this.escrowService = escrowService;
    }
    async handleWebhook(signature, payload) {
        if (!this.paystackService.verifyWebhookSignature(signature, payload)) {
            this.logger.error('Invalid Paystack webhook signature');
            throw new common_1.BadRequestException('Invalid signature');
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
    async handleChargeSuccess(data) {
        const { reference, metadata } = data;
        this.logger.log(`charge.success — reference: ${reference}`);
        const transactionId = metadata?.transactionId;
        if (transactionId) {
            await this.escrowService.transitionTo(transactionId, transaction_entity_1.EscrowStatus.PAYMENT_HELD, undefined);
        }
    }
    async handleTransferSuccess(data) {
        this.logger.log(`transfer.success — code: ${data.transfer_code}`);
    }
    async handleTransferFailed(data) {
        this.logger.error(`transfer.failed — code: ${data.transfer_code}, reason: ${data.reason}`);
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Paystack webhook listener (HMAC-SHA512 verified)' }),
    __param(0, (0, common_1.Headers)('x-paystack-signature')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('webhooks/paystack'),
    __metadata("design:paramtypes", [paystack_service_1.PaystackService,
        payments_service_1.PaymentsService,
        escrow_service_1.EscrowService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map