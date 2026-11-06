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
exports.DisputesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const require_full_profile_decorator_1 = require("../auth/decorators/require-full-profile.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const appeal_dispute_dto_1 = require("./dto/appeal-dispute.dto");
const create_dispute_dto_1 = require("./dto/create-dispute.dto");
const update_dispute_dto_1 = require("./dto/update-dispute.dto");
const disputes_service_1 = require("./disputes.service");
let DisputesController = class DisputesController {
    disputesService;
    constructor(disputesService) {
        this.disputesService = disputesService;
    }
    create(req, dto) {
        return this.disputesService.create(req.user.id, dto);
    }
    findAll(req) {
        return this.disputesService.findAllForUser(req.user.id);
    }
    findOne(id) {
        return this.disputesService.findOne(id);
    }
    update(id, dto, req) {
        return this.disputesService.update(id, dto, req.user.id);
    }
    appeal(req, dto) {
        return this.disputesService.appeal(req.user.id, dto);
    }
    sellerRespond(id, req, response) {
        return this.disputesService.sellerRespond(id, req.user.id, response);
    }
};
exports.DisputesController = DisputesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('buyer', 'seller'),
    (0, swagger_1.ApiOperation)({ summary: 'Raise a dispute on a transaction (freezes escrow immediately)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Dispute created, escrow frozen.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_dispute_dto_1.CreateDisputeDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'List disputes involving the authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Disputes returned.' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a dispute by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dispute returned.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('dispute_officer', 'senior_dispute_officer', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a dispute (officers/admins only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dispute updated.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_dispute_dto_1.UpdateDisputeDto, Object]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('appeal'),
    (0, require_full_profile_decorator_1.RequireFullProfile)(),
    (0, swagger_1.ApiOperation)({ summary: 'Appeal a resolved dispute (one appeal max, enforced in service)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Appeal submitted.' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, appeal_dispute_dto_1.AppealDisputeDto]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "appeal", null);
__decorate([
    (0, common_1.Post)(':id/seller-response'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    (0, swagger_1.ApiOperation)({ summary: 'Seller responds to a dispute within 12-hour window' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Seller response recorded.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)('response')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], DisputesController.prototype, "sellerRespond", null);
exports.DisputesController = DisputesController = __decorate([
    (0, swagger_1.ApiTags)('disputes'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('disputes'),
    __metadata("design:paramtypes", [disputes_service_1.DisputesService])
], DisputesController);
//# sourceMappingURL=disputes.controller.js.map