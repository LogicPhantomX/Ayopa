import { User } from '../../users/entities/user.entity';
export declare class KycProfile {
    id: string;
    user: User;
    userId: string;
    idType: string;
    idNumber: string;
    ociBucketPath: string;
    status: string;
    virusScanPassed: boolean;
    verificationDetails: any;
    createdAt: Date;
    updatedAt: Date;
}
