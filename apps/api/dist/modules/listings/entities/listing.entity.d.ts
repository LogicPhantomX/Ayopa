import { User } from '../../users/entities/user.entity';
export declare class Listing {
    id: string;
    seller: User;
    sellerId: string;
    title: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    location: string;
    status: string;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
