"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SmsService = SmsService_1 = class SmsService {
    configService;
    logger = new common_1.Logger(SmsService_1.name);
    apiKey;
    senderId;
    termiiBase = 'https://api.ng.termii.com/api';
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('SMS_API_KEY');
        this.senderId = this.configService.get('SMS_SENDER_ID', 'Ayopá');
        if (!this.apiKey) {
            this.logger.warn('⚠️  SMS_API_KEY is not set — SMS delivery is STUBBED. ' +
                'OTP codes will be logged to the console only. ' +
                'Set SMS_API_KEY (Termii) before going to production.');
        }
    }
    async send(to, message) {
        if (!this.apiKey) {
            this.logger.log(`[SMS STUB] To: ${to} | Message: ${message}`);
            return { messageId: `stub-${Date.now()}` };
        }
        const body = {
            to,
            from: this.senderId,
            sms: message,
            type: 'plain',
            channel: 'dnd',
            api_key: this.apiKey,
        };
        let response;
        try {
            response = await fetch(`${this.termiiBase}/sms/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        }
        catch (networkErr) {
            this.logger.error(`Termii network error: ${networkErr?.message}`);
            return { messageId: `error-${Date.now()}` };
        }
        let json;
        try {
            json = await response.json();
        }
        catch {
            this.logger.error('Termii returned an unparseable response');
            return { messageId: `error-${Date.now()}` };
        }
        const messageId = json?.message_id ?? json?.messageId ?? `term-${Date.now()}`;
        this.logger.log(`SMS sent to ${to} — messageId: ${messageId}`);
        return { messageId };
    }
    async sendOtp(phone, code, expiresInMinutes = 5) {
        const message = `Your Ayopá verification code is ${code}. ` +
            `It expires in ${expiresInMinutes} minutes. Do not share it with anyone.`;
        await this.send(phone, message);
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map