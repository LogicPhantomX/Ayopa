"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const audit_module_1 = require("../audit/audit.module");
const escrow_module_1 = require("../escrow/escrow.module");
const payment_entity_1 = require("../payments/entities/payment.entity");
const payments_module_1 = require("../payments/payments.module");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const paystack_controller_1 = require("./paystack.controller");
const paystack_service_1 = require("./paystack.service");
const webhook_controller_1 = require("./webhook.controller");
let PaystackModule = class PaystackModule {
};
exports.PaystackModule = PaystackModule;
exports.PaystackModule = PaystackModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([payment_entity_1.Payment, transaction_entity_1.Transaction]),
            audit_module_1.AuditModule,
            payments_module_1.PaymentsModule,
            escrow_module_1.EscrowModule,
        ],
        controllers: [paystack_controller_1.PaystackController, webhook_controller_1.WebhookController],
        providers: [paystack_service_1.PaystackService],
        exports: [paystack_service_1.PaystackService],
    })
], PaystackModule);
//# sourceMappingURL=paystack.module.js.map