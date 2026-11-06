import { ConfigService } from '@nestjs/config';
export declare class RefreshTokenStore {
    private readonly configService;
    private client;
    private readonly fallback;
    private readonly fallbackByUser;
    constructor(configService: ConfigService);
    issue(userId: string, ttlSeconds?: number): Promise<string>;
    consume(token: string): Promise<string | null>;
    revokeAllForUser(userId: string): Promise<void>;
    private hash;
    private key;
    private userSetKey;
    private getClient;
}
