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
exports.EscrowController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const escrow_service_1 = require("./escrow.service");
class TransitionDto {
    status;
}
let EscrowController = class EscrowController {
    escrowService;
    constructor(escrowService) {
        this.escrowService = escrowService;
    }
    transition(transactionId, dto, req) {
        return this.escrowService.transitionTo(transactionId, dto.status, req.user.id);
    }
    autoRelease() {
        return this.escrowService.processAutoReleases();
    }
};
exports.EscrowController = EscrowController;
__decorate([
    (0, common_1.Post)(':transactionId/transition'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('buyer', 'seller', 'moderator', 'super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Transition escrow state (server-side state machine enforced)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Escrow transitioned' }),
    __param(0, (0, common_1.Param)('transactionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TransitionDto, Object]),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "transition", null);
__decorate([
    (0, common_1.Post)('auto-release'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger 48hr auto-release sweep (super_admin / cron)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Number of auto-released transactions returned' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EscrowController.prototype, "autoRelease", null);
exports.EscrowController = EscrowController = __decorate([
    (0, swagger_1.ApiTags)('escrow'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('escrow'),
    __metadata("design:paramtypes", [escrow_service_1.EscrowService])
], EscrowController);
//# sourceMappingURL=escrow.controller.js.map