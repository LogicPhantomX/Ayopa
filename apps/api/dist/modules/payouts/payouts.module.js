"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const audit_module_1 = require("../audit/audit.module");
const paystack_module_1 = require("../paystack/paystack.module");
const payout_approval_entity_1 = require("./entities/payout-approval.entity");
const payout_request_entity_1 = require("./entities/payout-request.entity");
const payouts_controller_1 = require("./payouts.controller");
const payouts_service_1 = require("./payouts.service");
let PayoutsModule = class PayoutsModule {
};
exports.PayoutsModule = PayoutsModule;
exports.PayoutsModule = PayoutsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([payout_request_entity_1.PayoutRequest, payout_approval_entity_1.PayoutApproval]),
            paystack_module_1.PaystackModule,
            audit_module_1.AuditModule,
        ],
        controllers: [payouts_controller_1.PayoutsController],
        providers: [payouts_service_1.PayoutsService],
        exports: [payouts_service_1.PayoutsService],
    })
], PayoutsModule);
//# sourceMappingURL=payouts.module.js.map