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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutRequest = void 0;
const typeorm_1 = require("typeorm");
const payout_approval_entity_1 = require("./payout-approval.entity");
let PayoutRequest = class PayoutRequest {
    id;
    recipientCode;
    amount;
    reason;
    status;
    transferCode;
    requestedBy;
    approvals;
    createdAt;
    updatedAt;
};
exports.PayoutRequest = PayoutRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PayoutRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'recipient_code', length: 100 }),
    __metadata("design:type", String)
], PayoutRequest.prototype, "recipientCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], PayoutRequest.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: '' }),
    __metadata("design:type", String)
], PayoutRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', length: 50, default: 'pending' }),
    __metadata("design:type", String)
], PayoutRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transfer_code', length: 100, nullable: true }),
    __metadata("design:type", String)
], PayoutRequest.prototype, "transferCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requested_by', type: 'uuid' }),
    __metadata("design:type", String)
], PayoutRequest.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payout_approval_entity_1.PayoutApproval, (approval) => approval.payoutRequest, {
        eager: true,
        cascade: true,
    }),
    __metadata("design:type", Array)
], PayoutRequest.prototype, "approvals", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PayoutRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PayoutRequest.prototype, "updatedAt", void 0);
exports.PayoutRequest = PayoutRequest = __decorate([
    (0, typeorm_1.Entity)({ name: 'payout_requests' })
], PayoutRequest);
//# sourceMappingURL=payout-request.entity.js.map