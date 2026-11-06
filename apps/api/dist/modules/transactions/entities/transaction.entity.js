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
exports.Transaction = exports.EscrowStatus = void 0;
const typeorm_1 = require("typeorm");
const listing_entity_1 = require("../../listings/entities/listing.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var EscrowStatus;
(function (EscrowStatus) {
    EscrowStatus["CREATED"] = "CREATED";
    EscrowStatus["PAYMENT_HELD"] = "PAYMENT_HELD";
    EscrowStatus["FIRST_RELEASED"] = "FIRST_RELEASED";
    EscrowStatus["DELIVERY_CONFIRMED"] = "DELIVERY_CONFIRMED";
    EscrowStatus["COMPLETED"] = "COMPLETED";
    EscrowStatus["DISPUTED"] = "DISPUTED";
    EscrowStatus["DISPUTE_RESOLVED"] = "DISPUTE_RESOLVED";
    EscrowStatus["REFUNDED"] = "REFUNDED";
})(EscrowStatus || (exports.EscrowStatus = EscrowStatus = {}));
let Transaction = class Transaction {
    id;
    buyer;
    buyerId;
    seller;
    sellerId;
    listing;
    listingId;
    amount;
    currency;
    status;
    commissionAmount;
    firstReleaseAmount;
    escrowReleased;
    autoReleaseAt;
    createdAt;
    updatedAt;
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'buyer_id' }),
    __metadata("design:type", user_entity_1.User)
], Transaction.prototype, "buyer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'buyer_id', type: 'uuid' }),
    __metadata("design:type", String)
], Transaction.prototype, "buyerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'seller_id' }),
    __metadata("design:type", user_entity_1.User)
], Transaction.prototype, "seller", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seller_id', type: 'uuid' }),
    __metadata("design:type", String)
], Transaction.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => listing_entity_1.Listing, { eager: true, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'listing_id' }),
    __metadata("design:type", listing_entity_1.Listing)
], Transaction.prototype, "listing", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'listing_id', type: 'uuid' }),
    __metadata("design:type", String)
], Transaction.prototype, "listingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'NGN' }),
    __metadata("design:type", String)
], Transaction.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        default: EscrowStatus.CREATED
    }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'commission_amount', type: 'numeric', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "commissionAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_release_amount', type: 'numeric', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "firstReleaseAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'escrow_released', default: false }),
    __metadata("design:type", Boolean)
], Transaction.prototype, "escrowReleased", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'auto_release_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Transaction.prototype, "autoReleaseAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)({ name: 'transactions' })
], Transaction);
//# sourceMappingURL=transaction.entity.js.map