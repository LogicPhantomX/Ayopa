import { PaystackService } from './paystack.service';
export declare class PaystackController {
    private readonly paystackService;
    constructor(paystackService: PaystackService);
    createSubAccount(dto: {
        businessName: string;
        bankCode: string;
        accountNumber: string;
        primaryContactEmail?: string;
    }): Promise<{
        subaccount_code: string;
        business_name: string;
    }>;
    initialize(dto: {
        email: string;
        amount: number;
        subaccount?: string;
        transactionId?: string;
        callbackUrl?: string;
    }): Promise<import("./paystack.service").PaystackInitializeResult>;
    verify(reference: string): Promise<import("./paystack.service").PaystackVerifyResult>;
    createRecipient(dto: {
        name: string;
        accountNumber: string;
        bankCode: string;
        currency?: string;
    }): Promise<import("./paystack.service").PaystackRecipientResult>;
    listBanks(): Promise<import("./paystack.service").PaystackBank[]>;
}
