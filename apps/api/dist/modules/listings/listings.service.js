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
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const listing_entity_1 = require("./entities/listing.entity");
let ListingsService = class ListingsService {
    listingRepository;
    constructor(listingRepository) {
        this.listingRepository = listingRepository;
    }
    async create(userId, dto) {
        const listing = this.listingRepository.create({
            sellerId: userId,
            ...dto,
            status: 'draft',
            currency: dto.currency ?? 'NGN',
        });
        return this.listingRepository.save(listing);
    }
    async findAll(options = {}) {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const queryBuilder = this.listingRepository
            .createQueryBuilder('listing')
            .leftJoinAndSelect('listing.seller', 'seller');
        if (options.search) {
            queryBuilder.where('listing.title ILIKE :search', { search: `%${options.search}%` });
            queryBuilder.orWhere('listing.description ILIKE :search', { search: `%${options.search}%` });
        }
        if (options.category) {
            queryBuilder.andWhere('listing.category = :category', { category: options.category });
        }
        queryBuilder.orderBy('listing.createdAt', 'DESC');
        queryBuilder.skip((page - 1) * limit);
        queryBuilder.take(limit);
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const listing = await this.listingRepository.findOne({ where: { id } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        return listing;
    }
    async update(userId, id, dto) {
        const listing = await this.listingRepository.findOne({ where: { id } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.sellerId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own listings');
        }
        Object.assign(listing, dto);
        return this.listingRepository.save(listing);
    }
    async remove(userId, id) {
        const listing = await this.listingRepository.findOne({ where: { id } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.sellerId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own listings');
        }
        await this.listingRepository.softRemove(listing);
        return { deleted: true };
    }
    async findDeleted(options = {}) {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const [items, total] = await this.listingRepository
            .createQueryBuilder('listing')
            .leftJoinAndSelect('listing.seller', 'seller')
            .withDeleted()
            .where('listing.deleted_at IS NOT NULL')
            .orderBy('listing.deletedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            items,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(listing_entity_1.Listing)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ListingsService);
//# sourceMappingURL=listings.service.js.map