"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaystackService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
let PaystackService = PaystackService_1 = class PaystackService {
    configService;
    logger = new common_1.Logger(PaystackService_1.name);
    secretKey;
    baseUrl = 'https://api.paystack.co';
    constructor(configService) {
        this.configService = configService;
        this.secretKey = this.configService.get('PAYSTACK_SECRET_KEY', 'sk_test_placeholder');
    }
    verifyWebhookSignature(signature, payload) {
        if (!signature)
            return false;
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }
    async initializeTransaction(data) {
        this.logger.log(`Initializing Paystack transaction for ${data.email}, amount: ${data.amount} kobo`);
        const body = {
            email: data.email,
            amount: data.amount,
        };
        if (data.subaccount)
            body.subaccount = data.subaccount;
        if (data.transactionCharge != null)
            body.transaction_charge = data.transactionCharge;
        if (data.metadata)
            body.metadata = data.metadata;
        if (data.callback_url)
            body.callback_url = data.callback_url;
        const res = await this.post('/transaction/initialize', body);
        return res;
    }
    async verifyTransaction(reference) {
        this.logger.log(`Verifying Paystack transaction: ${reference}`);
        const data = await this.get(`/transaction/verify/${encodeURIComponent(reference)}`);
        return {
            status: data.status,
            reference: data.reference,
            amount: data.amount,
            currency: data.currency,
            metadata: data.metadata ?? {},
            gateway_response: data.gateway_response,
        };
    }
    async createSubAccount(sellerData) {
        this.logger.log(`Creating Paystack sub-account for ${sellerData.businessName}`);
        const body = {
            business_name: sellerData.businessName,
            settlement_bank: sellerData.bankCode,
            account_number: sellerData.accountNumber,
            percentage_charge: 5,
        };
        if (sellerData.primaryContactEmail)
            body.primary_contact_email = sellerData.primaryContactEmail;
        const data = await this.post('/subaccount', body);
        return { subaccount_code: data.subaccount_code, business_name: data.business_name };
    }
    async createTransferRecipient(data) {
        this.logger.log(`Creating transfer recipient: ${data.name} (${data.accountNumber})`);
        const body = {
            type: 'nuban',
            name: data.name,
            account_number: data.accountNumber,
            bank_code: data.bankCode,
            currency: data.currency ?? 'NGN',
        };
        const res = await this.post('/transferrecipient', body);
        return {
            recipient_code: res.recipient_code,
            type: res.type,
            name: res.name,
            account_number: res.details.account_number,
            bank_code: res.details.bank_code,
        };
    }
    async initiateTransfer(data) {
        this.logger.log(`Initiating transfer of ${data.amount} kobo to ${data.recipient}`);
        const body = {
            source: 'balance',
            amount: data.amount,
            recipient: data.recipient,
            reason: data.reason,
        };
        const res = await this.post('/transfer', body);
        return {
            status: res.status,
            transfer_code: res.transfer_code,
            amount: res.amount,
        };
    }
    async listBanks(country = 'nigeria') {
        this.logger.log('Fetching list of supported banks from Paystack');
        const data = await this.get(`/bank?country=${encodeURIComponent(country)}&perPage=100`);
        return (data ?? []).map((b) => ({
            name: b.name,
            code: b.code,
            slug: b.slug,
            country: b.country,
            currency: b.currency,
        }));
    }
    async post(path, body) {
        return this.request('POST', path, body);
    }
    async get(path) {
        return this.request('GET', path);
    }
    async request(method, path, body) {
        const url = `${this.baseUrl}${path}`;
        const options = {
            method,
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
            },
        };
        if (body !== undefined) {
            options.body = JSON.stringify(body);
        }
        let response;
        try {
            response = await fetch(url, options);
        }
        catch (networkErr) {
            this.logger.error(`Paystack network error [${method} ${path}]: ${networkErr?.message}`);
            throw new common_1.InternalServerErrorException('Paystack request failed due to a network error.');
        }
        let json;
        try {
            json = await response.json();
        }
        catch {
            throw new common_1.InternalServerErrorException('Paystack returned an unparseable response.');
        }
        if (!response.ok || json.status === false) {
            const message = json.message ?? `Paystack error (HTTP ${response.status})`;
            this.logger.error(`Paystack API error [${method} ${path}]: ${message}`);
            throw new common_1.BadRequestException(`Paystack: ${message}`);
        }
        return (json.data ?? json);
    }
};
exports.PaystackService = PaystackService;
exports.PaystackService = PaystackService = PaystackService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaystackService);
//# sourceMappingURL=paystack.service.js.map