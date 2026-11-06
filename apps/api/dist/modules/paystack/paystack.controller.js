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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const require_full_profile_decorator_1 = require("../auth/decorators/require-full-profile.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const paystack_service_1 = require("./paystack.service");
let PaystackController = class PaystackController {
    paystackService;
    constructor(paystackService) {
        this.paystackService = paystackService;
    }
    createSubAccount(dto) {
        return this.paystackService.createSubAccount(dto);
    }
    initialize(dto) {
        return this.paystackService.initializeTransaction({
            email: dto.email,
            amount: dto.amount,
            subaccount: dto.subaccount,
            metadata: dto.transactionId ? { transactionId: dto.transactionId } : undefined,
            callback_url: dto.callbackUrl,
        });
    }
    verify(reference) {
        return this.paystackService.verifyTransaction(reference);
    }
    createRecipient(dto) {
        return this.paystackService.createTransferRecipient({
            name: dto.name,
            accountNumber: dto.accountNumber,
            bankCode: dto.bankCode,
            currency: dto.currency,
        });
    }
    listBanks() {
        return this.paystackService.listBanks();
    }
};
exports.PaystackController = PaystackController;
__decorate([
    (0, common_1.Post)('subaccount'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller', 'admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a Paystack sub-account for a seller (split payments)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Sub-account created.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaystackController.prototype, "createSubAccount", null);
__decorate([
    (0, common_1.Post)('initialize'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize a Paystack checkout transaction' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Checkout URL returned.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaystackController.prototype, "initialize", null);
__decorate([
    (0, common_1.Get)('verify/:reference'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verify a Paystack transaction by reference' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction status returned.' }),
    __param(0, (0, common_1.Param)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaystackController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('recipient'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('finance_officer', 'admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a Paystack transfer recipient (bank account)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Recipient created.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaystackController.prototype, "createRecipient", null);
__decorate([
    (0, common_1.Get)('banks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'List Nigerian banks supported by Paystack' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of banks returned.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaystackController.prototype, "listBanks", null);
exports.PaystackController = PaystackController = __decorate([
    (0, swagger_1.ApiTags)('paystack'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('paystack'),
    __metadata("design:paramtypes", [paystack_service_1.PaystackService])
], PaystackController);
//# sourceMappingURL=paystack.controller.js.map