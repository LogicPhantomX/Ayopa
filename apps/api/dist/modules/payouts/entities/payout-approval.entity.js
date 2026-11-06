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
exports.PayoutApproval = void 0;
const typeorm_1 = require("typeorm");
const payout_request_entity_1 = require("./payout-request.entity");
let PayoutApproval = class PayoutApproval {
    id;
    payoutRequestId;
    payoutRequest;
    approvedBy;
    comment;
    approvedAt;
};
exports.PayoutApproval = PayoutApproval;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PayoutApproval.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payout_request_id', type: 'uuid' }),
    __metadata("design:type", String)
], PayoutApproval.prototype, "payoutRequestId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payout_request_entity_1.PayoutRequest, (req) => req.approvals, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'payout_request_id' }),
    __metadata("design:type", payout_request_entity_1.PayoutRequest)
], PayoutApproval.prototype, "payoutRequest", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'approved_by', type: 'uuid' }),
    __metadata("design:type", String)
], PayoutApproval.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], PayoutApproval.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'approved_at' }),
    __metadata("design:type", Date)
], PayoutApproval.prototype, "approvedAt", void 0);
exports.PayoutApproval = PayoutApproval = __decorate([
    (0, typeorm_1.Entity)({ name: 'payout_approvals' })
], PayoutApproval);
//# sourceMappingURL=payout-approval.entity.js.map