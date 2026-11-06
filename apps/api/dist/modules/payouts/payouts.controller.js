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
exports.PayoutsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const approve_payout_dto_1 = require("./dto/approve-payout.dto");
const create_payout_request_dto_1 = require("./dto/create-payout-request.dto");
const payouts_service_1 = require("./payouts.service");
let PayoutsController = class PayoutsController {
    payoutsService;
    constructor(payoutsService) {
        this.payoutsService = payoutsService;
    }
    create(req, dto) {
        return this.payoutsService.createPayoutRequest(req.user.id, dto);
    }
    approve(id, req, dto) {
        return this.payoutsService.approvePayout(id, req.user.id, dto);
    }
    reject(id, req, reason) {
        return this.payoutsService.rejectPayout(id, req.user.id, reason);
    }
    findAll(status) {
        return this.payoutsService.findAll(status);
    }
    findOne(id) {
        return this.payoutsService.findOne(id);
    }
};
exports.PayoutsController = PayoutsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('finance_officer', 'super_admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Initiate a payout. Amounts > ₦500,000 create a dual-approval request.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payout initiated or request queued.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_payout_request_dto_1.CreatePayoutRequestDto]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Approve a pending payout request. Two distinct admin approvals execute the transfer.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Approval recorded.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, approve_payout_dto_1.ApprovePayoutDto]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, roles_decorator_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a pending payout request.' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payout rejected.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('finance_officer', 'admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'List payout requests, optionally filtered by status.' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['pending', 'approved', 'executing', 'completed', 'rejected', 'failed'] }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('finance_officer', 'admin', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single payout request with its approvals.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayoutsController.prototype, "findOne", null);
exports.PayoutsController = PayoutsController = __decorate([
    (0, swagger_1.ApiTags)('payouts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('payouts'),
    __metadata("design:paramtypes", [payouts_service_1.PayoutsService])
], PayoutsController);
//# sourceMappingURL=payouts.controller.js.map