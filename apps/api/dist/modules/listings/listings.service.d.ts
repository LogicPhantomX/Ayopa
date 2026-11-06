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
export declare class ListingsService {
    private readonly listingRepository;
    constructor(listingRepository: Repository<Listing>);
    create(userId: string, dto: CreateListingDto): Promise<Listing>;
    findAll(options?: ListingQueryOptions): Promise<{
        items: Listing[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<Listing>;
    update(userId: string, id: string, dto: UpdateListingDto): Promise<Listing>;
    remove(userId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    findDeleted(options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: Listing[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export {};
