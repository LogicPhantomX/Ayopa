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
exports.KycController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const require_full_profile_decorator_1 = require("../auth/decorators/require-full-profile.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const kyc_upload_dto_1 = require("./dto/kyc-upload.dto");
const kyc_service_1 = require("./kyc.service");
let KycController = class KycController {
    kycService;
    constructor(kycService) {
        this.kycService = kycService;
    }
    getForUser(userId) {
        return this.kycService.getForUser(userId);
    }
    submit(req, dto) {
        return this.kycService.submit(req.user.id, dto);
    }
    updateStatus(id, status, reviewNote) {
        return this.kycService.updateStatus(id, status, reviewNote);
    }
};
exports.KycController = KycController;
__decorate([
    (0, common_1.Get)(':userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('verification_agent', 'moderator', 'super_admin', 'support_agent'),
    (0, swagger_1.ApiOperation)({ summary: 'Get KYC profile for a user (admin/agents only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'KYC profile returned' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "getForUser", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit KYC document (virus scan + NIMC/BVN verification + PAR issuance)',
        description: 'Requires a completed profile (POST /auth/profile/setup first). ' +
            'Sellers cannot create listings until KYC status is APPROVED.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'KYC profile created/updated' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, kyc_upload_dto_1.KycUploadDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "submit", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('verification_agent', 'senior_dispute_officer', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update KYC status (verification agents/admins only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'KYC status updated' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('reviewNote')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "updateStatus", null);
exports.KycController = KycController = __decorate([
    (0, swagger_1.ApiTags)('kyc'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('kyc'),
    __metadata("design:paramtypes", [kyc_service_1.KycService])
], KycController);
//# sourceMappingURL=kyc.controller.js.map