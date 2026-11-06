import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from './sms.interfaces';
export declare class SmsService implements ISmsProvider {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly senderId;
    private readonly termiiBase;
    constructor(configService: ConfigService);
    send(to: string, message: string): Promise<{
        messageId: string;
    }>;
    sendOtp(phone: string, code: string, expiresInMinutes?: number): Promise<void>;
}
