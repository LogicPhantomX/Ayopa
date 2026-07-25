import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { Listing } from './entities/listing.entity';

interface ListingQueryOptions {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
}

@Injectable()
export class ListingsService {
    constructor(
        @InjectRepository(Listing)
        private readonly listingRepository: Repository<Listing>,
    ) { }

    async create(userId: string, dto: CreateListingDto) {
        const listing = this.listingRepository.create({
            sellerId: userId,
            ...dto,
            status: 'draft',
            currency: dto.currency ?? 'NGN',
        });

        return this.listingRepository.save(listing);
    }

    async findAll(options: ListingQueryOptions = {}) {
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

    async findOne(id: string) {
        const listing = await this.listingRepository.findOne({ where: { id } });
        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        return listing;
    }

    async update(userId: string, id: string, dto: UpdateListingDto) {
        const listing = await this.listingRepository.findOne({ where: { id } });
        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.sellerId !== userId) {
            throw new ForbiddenException('You can only update your own listings');
        }

        Object.assign(listing, dto);
        return this.listingRepository.save(listing);
    }

    // ── Item 3: Soft delete ────────────────────────────────────────────────────
    // Uses TypeORM's softRemove() which sets deleted_at instead of issuing DELETE.
    // The row is preserved in the database and remains queryable by admins via
    // findDeleted().
    async remove(userId: string, id: string) {
        const listing = await this.listingRepository.findOne({ where: { id } });
        if (!listing) {
            throw new NotFoundException('Listing not found');
        }

        if (listing.sellerId !== userId) {
            throw new ForbiddenException('You can only delete your own listings');
        }

        await this.listingRepository.softRemove(listing);
        return { deleted: true };
    }

    // ── Item 3: Admin-only — query soft-deleted listings ──────────────────────
    async findDeleted(options: { page?: number; limit?: number } = {}) {
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
}
