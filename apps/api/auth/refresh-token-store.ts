import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { createClient } from 'redis';

interface RefreshRecord {
    userId: string;
    createdAt: number;
}

const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

@Injectable()
export class RefreshTokenStore {
    private client: Awaited<ReturnType<typeof createClient>> | null = null;
    // fallback only for local/dev when no Redis is configured — NOT for production,
    // since it's process-local and gone on restart.
    private readonly fallback = new Map<string, RefreshRecord>();
    private readonly fallbackByUser = new Map<string, Set<string>>();

    constructor(private readonly configService: ConfigService) { }

    /**
     * Issues a new opaque refresh token for a user. Tokens are keyed by
     * the token itself (not by user), so a user can hold multiple valid
     * refresh tokens at once — one per active session/device.
     */
    async issue(userId: string, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<string> {
        const token = randomBytes(48).toString('hex');
        const hashedToken = this.hash(token);
        const key = this.key(hashedToken);
        const record: RefreshRecord = { userId, createdAt: Date.now() };

        const client = await this.getClient();
        if (client) {
            await client.set(key, JSON.stringify(record), { EX: ttlSeconds });
            await client.sAdd(this.userSetKey(userId), hashedToken);
            await client.expire(this.userSetKey(userId), ttlSeconds);
            return token;
        }

        this.fallback.set(key, record);
        const set = this.fallbackByUser.get(userId) ?? new Set<string>();
        set.add(hashedToken);
        this.fallbackByUser.set(userId, set);
        return token;
    }

    /**
     * Validates and rotates a refresh token in one step: if valid, deletes
     * it (single-use / rotation-on-refresh) and returns the associated
     * userId. Returns null if the token is unknown, expired, or reused.
     */
    async consume(token: string): Promise<string | null> {
        const hashedToken = this.hash(token);
        const key = this.key(hashedToken);
        const client = await this.getClient();

        if (client) {
            const raw = await client.get(key);
            if (!raw) {
                return null;
            }
            const record = JSON.parse(raw) as RefreshRecord;
            await client.del(key);
            await client.sRem(this.userSetKey(record.userId), hashedToken);
            return record.userId;
        }

        const record = this.fallback.get(key);
        if (!record) {
            return null;
        }
        this.fallback.delete(key);
        this.fallbackByUser.get(record.userId)?.delete(hashedToken);
        return record.userId;
    }

    /** Revokes every active refresh token for a user (e.g. on password change, admin lockout). */
    async revokeAllForUser(userId: string): Promise<void> {
        const client = await this.getClient();
        if (client) {
            const hashedTokens = await client.sMembers(this.userSetKey(userId));
            if (hashedTokens.length > 0) {
                await client.del(hashedTokens.map((ht) => this.key(ht)));
            }
            await client.del(this.userSetKey(userId));
            return;
        }

        const hashedTokens = this.fallbackByUser.get(userId);
        if (hashedTokens) {
            for (const ht of hashedTokens) {
                this.fallback.delete(this.key(ht));
            }
            this.fallbackByUser.delete(userId);
        }
    }

    private hash(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }

    private key(hashedToken: string) {
        // store by hash so a leaked Redis dump doesn't directly hand out live tokens
        return `refresh:${hashedToken}`;
    }

    private userSetKey(userId: string) {
        return `refresh:user:${userId}`;
    }

    private async getClient() {
        if (this.client) {
            return this.client;
        }

        if (this.configService.get<string>('REDIS_URL') || this.configService.get<string>('REDIS_HOST')) {
            try {
                this.client = createClient({ url: this.configService.get<string>('REDIS_URL') });
                await this.client.connect();
                return this.client;
            } catch {
                this.client = null;
            }
        }

        return null;
    }
}
