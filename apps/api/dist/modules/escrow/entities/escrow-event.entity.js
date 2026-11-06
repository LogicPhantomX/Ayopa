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
exports.EscrowEvent = void 0;
const typeorm_1 = require("typeorm");
const transaction_entity_1 = require("../../transactions/entities/transaction.entity");
let EscrowEvent = class EscrowEvent {
    id;
    transaction;
    transactionId;
    fromStatus;
    toStatus;
    actorId;
    metadata;
    createdAt;
};
exports.EscrowEvent = EscrowEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EscrowEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => transaction_entity_1.Transaction, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'transaction_id' }),
    __metadata("design:type", transaction_entity_1.Transaction)
], EscrowEvent.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_id', type: 'uuid' }),
    __metadata("design:type", String)
], EscrowEvent.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_status', length: 50, nullable: true }),
    __metadata("design:type", String)
], EscrowEvent.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_status', length: 50 }),
    __metadata("design:type", String)
], EscrowEvent.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], EscrowEvent.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], EscrowEvent.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], EscrowEvent.prototype, "createdAt", void 0);
exports.EscrowEvent = EscrowEvent = __decorate([
    (0, typeorm_1.Entity)({ name: 'escrow_events' })
], EscrowEvent);
//# sourceMappingURL=escrow-event.entity.js.map