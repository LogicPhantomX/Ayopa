import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PaystackInitializeResult {
    authorization_url: string;
    access_code: string;
    reference: string;
}

export interface PaystackVerifyResult {
    status: string;          // 'success' | 'failed' | 'pending'
    reference: string;
    amount: number;          // in kobo
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
    status: string;          // 'otp' | 'pending' | 'success' | 'failed'
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

@Injectable()
export class PaystackService {
    private readonly logger = new Logger(PaystackService.name);
    private readonly secretKey: string;
    private readonly baseUrl = 'https://api.paystack.co';

    constructor(private readonly configService: ConfigService) {
        this.secretKey = this.configService.get<string>(
            'PAYSTACK_SECRET_KEY',
            'sk_test_placeholder',
        );
    }

    // ─── Webhook signature ────────────────────────────────────────────────────────

    /**
     * Verifies the HMAC-SHA512 signature from Paystack webhooks.
     */
    verifyWebhookSignature(signature: string, payload: any): boolean {
        if (!signature) return false;
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }

    // ─── Transaction ──────────────────────────────────────────────────────────────

    /**
     * POST /transaction/initialize
     * Returns the hosted-checkout URL for the buyer.
     */
    async initializeTransaction(data: {
        email: string;
        amount: number;         // in kobo (smallest unit)
        subaccount?: string;
        transactionCharge?: number;
        metadata?: Record<string, any>;
        callback_url?: string;
    }): Promise<PaystackInitializeResult> {
        this.logger.log(
            `Initializing Paystack transaction for ${data.email}, amount: ${data.amount} kobo`,
        );

        const body: Record<string, any> = {
            email: data.email,
            amount: data.amount,
        };
        if (data.subaccount) body.subaccount = data.subaccount;
        if (data.transactionCharge != null)
            body.transaction_charge = data.transactionCharge;
        if (data.metadata) body.metadata = data.metadata;
        if (data.callback_url) body.callback_url = data.callback_url;

        const res = await this.post<{
            authorization_url: string;
            access_code: string;
            reference: string;
        }>('/transaction/initialize', body);

        return res;
    }

    /**
     * GET /transaction/verify/:reference
     * Returns the final status of a transaction.
     */
    async verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
        this.logger.log(`Verifying Paystack transaction: ${reference}`);

        const data = await this.get<{
            status: string;
            reference: string;
            amount: number;
            currency: string;
            metadata: Record<string, any>;
            gateway_response: string;
        }>(`/transaction/verify/${encodeURIComponent(reference)}`);

        return {
            status: data.status,
            reference: data.reference,
            amount: data.amount,
            currency: data.currency,
            metadata: data.metadata ?? {},
            gateway_response: data.gateway_response,
        };
    }

    // ─── Sub-account ──────────────────────────────────────────────────────────────

    /**
     * POST /subaccount
     * Registers a seller for split-payment disbursement.
     */
    async createSubAccount(sellerData: {
        businessName: string;
        bankCode: string;
        accountNumber: string;
        primaryContactEmail?: string;
    }): Promise<{ subaccount_code: string; business_name: string }> {
        this.logger.log(
            `Creating Paystack sub-account for ${sellerData.businessName}`,
        );

        const body: Record<string, any> = {
            business_name: sellerData.businessName,
            settlement_bank: sellerData.bankCode,
            account_number: sellerData.accountNumber,
            percentage_charge: 5, // 5% platform commission
        };
        if (sellerData.primaryContactEmail)
            body.primary_contact_email = sellerData.primaryContactEmail;

        const data = await this.post<{
            subaccount_code: string;
            business_name: string;
        }>('/subaccount', body);

        return { subaccount_code: data.subaccount_code, business_name: data.business_name };
    }

    // ─── Transfer recipient ───────────────────────────────────────────────────────

    /**
     * POST /transferrecipient
     * Creates a reusable recipient object tied to a bank account.
     * Must be called before initiating a transfer.
     */
    async createTransferRecipient(data: {
        name: string;
        accountNumber: string;
        bankCode: string;
        currency?: string;
    }): Promise<PaystackRecipientResult> {
        this.logger.log(
            `Creating transfer recipient: ${data.name} (${data.accountNumber})`,
        );

        const body: Record<string, any> = {
            type: 'nuban',
            name: data.name,
            account_number: data.accountNumber,
            bank_code: data.bankCode,
            currency: data.currency ?? 'NGN',
        };

        const res = await this.post<{
            recipient_code: string;
            type: string;
            name: string;
            details: { account_number: string; bank_code: string };
        }>('/transferrecipient', body);

        return {
            recipient_code: res.recipient_code,
            type: res.type,
            name: res.name,
            account_number: res.details.account_number,
            bank_code: res.details.bank_code,
        };
    }

    // ─── Transfer ─────────────────────────────────────────────────────────────────

    /**
     * POST /transfer
     * Executes a payout to an existing recipient.
     * Caller is responsible for dual-approval gate on amounts > ₦500,000.
     */
    async initiateTransfer(data: {
        amount: number;     // in kobo
        recipient: string;  // recipient_code
        reason: string;
    }): Promise<PaystackTransferResult> {
        this.logger.log(
            `Initiating transfer of ${data.amount} kobo to ${data.recipient}`,
        );

        const body = {
            source: 'balance',
            amount: data.amount,
            recipient: data.recipient,
            reason: data.reason,
        };

        const res = await this.post<{
            status: string;
            transfer_code: string;
            amount: number;
        }>('/transfer', body);

        return {
            status: res.status,
            transfer_code: res.transfer_code,
            amount: res.amount,
        };
    }

    // ─── Banks ────────────────────────────────────────────────────────────────────

    /**
     * GET /bank
     * Lists all Nigerian banks supported by Paystack.
     */
    async listBanks(country = 'nigeria'): Promise<PaystackBank[]> {
        this.logger.log('Fetching list of supported banks from Paystack');

        const data = await this.get<
            {
                name: string;
                code: string;
                slug: string;
                country: string;
                currency: string;
            }[]
        >(`/bank?country=${encodeURIComponent(country)}&perPage=100`);

        return (data ?? []).map((b) => ({
            name: b.name,
            code: b.code,
            slug: b.slug,
            country: b.country,
            currency: b.currency,
        }));
    }

    // ─── HTTP helpers ─────────────────────────────────────────────────────────────

    private async post<T>(path: string, body: Record<string, any>): Promise<T> {
        return this.request<T>('POST', path, body);
    }

    private async get<T>(path: string): Promise<T> {
        return this.request<T>('GET', path);
    }

    private async request<T>(
        method: string,
        path: string,
        body?: Record<string, any>,
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const options: RequestInit = {
            method,
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
        };
        if (body !== undefined) {
            options.body = JSON.stringify(body);
        }

        let response: Response;
        try {
            response = await fetch(url, options);
        } catch (networkErr: any) {
            this.logger.error(
                `Paystack network error [${method} ${path}]: ${networkErr?.message}`,
            );
            throw new InternalServerErrorException(
                'Paystack request failed due to a network error.',
            );
        }

        let json: any;
        try {
            json = await response.json();
        } catch {
            throw new InternalServerErrorException(
                'Paystack returned an unparseable response.',
            );
        }

        if (!response.ok || json.status === false) {
            const message = json.message ?? `Paystack error (HTTP ${response.status})`;
            this.logger.error(`Paystack API error [${method} ${path}]: ${message}`);
            throw new BadRequestException(`Paystack: ${message}`);
        }

        // Paystack wraps the actual payload in a `data` field.
        return (json.data ?? json) as T;
    }
}
