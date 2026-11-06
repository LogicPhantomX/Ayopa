import { Listing } from '../../listings/entities/listing.entity';
import { User } from '../../users/entities/user.entity';
export declare enum EscrowStatus {
    CREATED = "CREATED",
    PAYMENT_HELD = "PAYMENT_HELD",
    FIRST_RELEASED = "FIRST_RELEASED",
    DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED",
    COMPLETED = "COMPLETED",
    DISPUTED = "DISPUTED",
    DISPUTE_RESOLVED = "DISPUTE_RESOLVED",
    REFUNDED = "REFUNDED"
}
export declare class Transaction {
    id: string;
    buyer: User;
    buyerId: string;
    seller: User;
    sellerId: string;
    listing: Listing;
    listingId: string;
    amount: number;
    currency: string;
    status: EscrowStatus;
    commissionAmount: number;
    firstReleaseAmount: number;
    escrowReleased: boolean;
    autoReleaseAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
