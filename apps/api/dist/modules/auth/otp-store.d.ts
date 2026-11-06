import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class OtpStore implements OnModuleInit {
    private readonly configService;
    private client;
    private readonly fallback;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    setOtp(phone: string, code: string, ttlSeconds?: number): Promise<string>;
    verifyOtp(phone: string, code: string): Promise<{
        ok: boolean;
        locked: boolean;
    }>;
    clear(phone: string): Promise<void>;
    private key;
    private hashCode;
    private getClient;
    private getRecord;
    private putRecord;
}
