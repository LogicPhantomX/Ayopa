import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsService } from './listings.service';
export declare class ListingsController {
    private readonly listingsService;
    constructor(listingsService: ListingsService);
    create(req: any, dto: CreateListingDto): Promise<import("./entities/listing.entity").Listing>;
    findAll(search?: string, category?: string, page?: string, limit?: string): Promise<{
        items: import("./entities/listing.entity").Listing[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findDeleted(page?: string, limit?: string): Promise<{
        items: import("./entities/listing.entity").Listing[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<import("./entities/listing.entity").Listing>;
    update(req: any, id: string, dto: UpdateListingDto): Promise<import("./entities/listing.entity").Listing>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
    }>;
}
