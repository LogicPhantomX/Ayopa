import { ConfigService } from '@nestjs/config';
export type EmailEvent = 'registration' | 'order_placed' | 'escrow_funded' | 'dispute_opened' | 'escrow_released';
export interface EmailPayload {
    to: string;
    event: EmailEvent;
    data?: Record<string, any>;
}
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private readonly transporter;
    private readonly fromAddress;
    constructor(configService: ConfigService);
    sendRegistrationEmail(to: string, fullName?: string | null): Promise<void>;
    sendOrderPlacedEmail(to: string, data: {
        transactionId: string;
        listingTitle?: string;
        amount: number;
        currency?: string;
    }): Promise<void>;
    sendEscrowFundedEmail(to: string, data: {
        transactionId: string;
        amount: number;
        currency?: string;
        sellerName?: string | null;
    }): Promise<void>;
    sendDisputeOpenedEmail(to: string, data: {
        transactionId: string;
        disputeId: string;
        reason?: string;
    }): Promise<void>;
    sendEscrowReleasedEmail(to: string, data: {
        transactionId: string;
        amount: number;
        currency?: string;
        recipientName?: string | null;
    }): Promise<void>;
    private send;
}
