import { User } from './user.entity';
export declare class KycProfile {
    id: string;
    user: User;
    userId: string;
    idType: string;
    idNumber: string;
    bvn: string;
    address: string;
    status: string;
    reviewNote: string;
    createdAt: Date;
    updatedAt: Date;
}
