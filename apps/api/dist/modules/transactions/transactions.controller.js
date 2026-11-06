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
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const require_full_profile_decorator_1 = require("../auth/decorators/require-full-profile.decorator");
const create_transaction_dto_1 = require("./dto/create-transaction.dto");
const update_transaction_status_dto_1 = require("./dto/update-transaction-status.dto");
const transactions_service_1 = require("./transactions.service");
let TransactionsController = class TransactionsController {
    transactionsService;
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    create(req, dto) {
        return this.transactionsService.create(req.user.id, dto);
    }
    findAll(req) {
        return this.transactionsService.findAllForUser(req.user.id);
    }
    updateStatus(id, dto) {
        return this.transactionsService.updateStatus(id, dto);
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a transaction for a listing (initiates escrow)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Transaction created' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'List transactions for the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transactions returned' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update transaction status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_transaction_status_dto_1.UpdateTransactionStatusDto]),
    __metadata("design:returntype", void 0)
], TransactionsController.prototype, "updateStatus", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)('transactions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map