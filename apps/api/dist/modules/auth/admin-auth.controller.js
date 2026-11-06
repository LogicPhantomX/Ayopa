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
exports.AdminAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const admin_auth_service_1 = require("./admin-auth.service");
let AdminAuthController = class AdminAuthController {
    adminAuthService;
    constructor(adminAuthService) {
        this.adminAuthService = adminAuthService;
    }
    async login(dto) {
        return this.adminAuthService.loginAdmin(dto.email, dto.password);
    }
    async verifyTotp(dto) {
        return this.adminAuthService.verifyAdminTotp(dto.email, dto.code);
    }
    async unlock(dto) {
        return this.adminAuthService.unlockAdmin(dto.actorRole, dto.targetEmail);
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ otp: { ttl: 60_000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Step 1: admin email/password login (returns requiresTotp)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password verified, TOTP step required' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('totp/verify'),
    (0, throttler_1.Throttle)({ otp: { ttl: 60_000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Step 2: verify admin TOTP code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'TOTP verified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "verifyTotp", null);
__decorate([
    (0, common_1.Post)('unlock'),
    (0, throttler_1.Throttle)({ auth: { ttl: 60_000, limit: 20 } }),
    (0, swagger_1.ApiOperation)({ summary: 'super_admin-only: unlock a locked admin account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Account unlocked' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "unlock", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, swagger_1.ApiTags)('admin-auth'),
    (0, common_1.Controller)('admin/auth'),
    __metadata("design:paramtypes", [admin_auth_service_1.AdminAuthService])
], AdminAuthController);
//# sourceMappingURL=admin-auth.controller.js.map