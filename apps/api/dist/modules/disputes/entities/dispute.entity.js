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
exports.Dispute = void 0;
const typeorm_1 = require("typeorm");
const transaction_entity_1 = require("../../transactions/entities/transaction.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let Dispute = class Dispute {
    id;
    transaction;
    transactionId;
    initiator;
    initiatorId;
    reason;
    status;
    responseDeadline;
    appealCount;
    resolutionSummary;
    sellerResponse;
    createdAt;
    updatedAt;
};
exports.Dispute = Dispute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Dispute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => transaction_entity_1.Transaction, { eager: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'transaction_id' }),
    __metadata("design:type", transaction_entity_1.Transaction)
], Dispute.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], Dispute.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'initiator_id' }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "initiator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'initiator_id', type: 'uuid' }),
    __metadata("design:type", String)
], Dispute.prototype, "initiatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Dispute.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'open' }),
    __metadata("design:type", String)
], Dispute.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'response_deadline', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Dispute.prototype, "responseDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'appeal_count', default: 0 }),
    __metadata("design:type", Number)
], Dispute.prototype, "appealCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resolution_summary', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "resolutionSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seller_response', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "sellerResponse", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Dispute.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Dispute.prototype, "updatedAt", void 0);
exports.Dispute = Dispute = __decorate([
    (0, typeorm_1.Entity)({ name: 'disputes' })
], Dispute);
//# sourceMappingURL=dispute.entity.js.map