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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_service_1 = require("../audit/audit.service");
const listing_entity_1 = require("../listings/entities/listing.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
let TransactionsService = class TransactionsService {
    transactionRepository;
    listingRepository;
    auditService;
    constructor(transactionRepository, listingRepository, auditService) {
        this.transactionRepository = transactionRepository;
        this.listingRepository = listingRepository;
        this.auditService = auditService;
    }
    async create(buyerId, dto) {
        const listing = await this.listingRepository.findOne({ where: { id: dto.listingId } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        const transaction = this.transactionRepository.create({
            buyerId,
            sellerId: listing.sellerId,
            listingId: listing.id,
            amount: dto.amount,
            currency: 'NGN',
            status: transaction_entity_1.EscrowStatus.CREATED,
        });
        const savedTransaction = await this.transactionRepository.save(transaction);
        await this.auditService.log('transaction', 'created', buyerId, {
            transactionId: savedTransaction.id,
            listingId: listing.id,
            amount: dto.amount,
        });
        return savedTransaction;
    }
    async findAllForUser(userId) {
        return this.transactionRepository.find({
            where: [{ buyerId: userId }, { sellerId: userId }],
            order: { createdAt: 'DESC' },
        });
    }
    async updateStatus(id, dto) {
        const transaction = await this.transactionRepository.findOne({ where: { id } });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        transaction.status = dto.status;
        transaction.escrowReleased = dto.status === transaction_entity_1.EscrowStatus.COMPLETED;
        const savedTransaction = await this.transactionRepository.save(transaction);
        await this.auditService.log('transaction', 'status_updated', undefined, {
            transactionId: savedTransaction.id,
            status: dto.status,
        });
        return savedTransaction;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(listing_entity_1.Listing)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map