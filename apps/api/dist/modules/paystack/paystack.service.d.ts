import { ConfigService } from '@nestjs/config';
export interface PaystackInitializeResult {
    authorization_url: string;
    access_code: string;
    reference: string;
}
export interface PaystackVerifyResult {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
    gateway_response: string;
}
export interface PaystackRecipientResult {
    recipient_code: string;
    type: string;
    name: string;
    account_number: string;
    bank_code: string;
}
export interface PaystackTransferResult {
    status: string;
    transfer_code: string;
    amount: number;
}
export interface PaystackBank {
    name: string;
    code: string;
    slug: string;
    country: string;
    currency: string;
}
export declare class PaystackService {
    private readonly configService;
    private readonly logger;
    private readonly secretKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    verifyWebhookSignature(signature: string, payload: any): boolean;
    initializeTransaction(data: {
        email: string;
        amount: number;
        subaccount?: string;
        transactionCharge?: number;
        metadata?: Record<string, any>;
        callback_url?: string;
    }): Promise<PaystackInitializeResult>;
    verifyTransaction(reference: string): Promise<PaystackVerifyResult>;
    createSubAccount(sellerData: {
        businessName: string;
        bankCode: string;
        accountNumber: string;
        primaryContactEmail?: string;
    }): Promise<{
        subaccount_code: string;
        business_name: string;
    }>;
    createTransferRecipient(data: {
        name: string;
        accountNumber: string;
        bankCode: string;
        currency?: string;
    }): Promise<PaystackRecipientResult>;
    initiateTransfer(data: {
        amount: number;
        recipient: string;
        reason: string;
    }): Promise<PaystackTransferResult>;
    listBanks(country?: string): Promise<PaystackBank[]>;
    private post;
    private get;
    private request;
}
