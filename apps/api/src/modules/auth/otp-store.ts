import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { createClient } from 'redis';

interface OtpRecord {
    hash: string;
    attempts: number;
    lockedUntil: number;
}

// ── Item 2: OtpStore Redis requirement ────────────────────────────────────────
// In production (NODE_ENV === 'production'), Redis is mandatory. The service
// will throw on module init if Redis is unreachable, preventing a silent
// fallback to the in-memory store where OTPs would be lost on restart or
// across scaled instances.
// In development and test, the in-memory fallback is still permitted.

@Injectable()
export class OtpStore implements OnModuleInit {
    private client: Awaited<ReturnType<typeof createClient>> | null = null;
    private readonly fallback = new Map<string, OtpRecord>();

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
        if (isProduction) {
            const redisUrl = this.configService.get<string>('REDIS_URL');
            if (!redisUrl) {
                throw new Error(
                    '[OtpStore] REDIS_URL is required in production. The in-memory OTP fallback is not safe for production use.',
                );
            }
            try {
                this.client = createClient({ url: redisUrl });
                this.client.on('error', (err: Error) => {
                    console.error('[OtpStore] Redis client error:', err.message);
                });
                await this.client.connect();
            } catch (err: any) {
                throw new Error(
                    `[OtpStore] Failed to connect to Redis in production — refusing to start. ` +
                    `Ensure Redis is reachable at REDIS_URL. Original error: ${err?.message ?? err}`,
                );
            }
        }
    }

    async setOtp(phone: string, code: string, ttlSeconds = 300) {
        const payload: OtpRecord = {
            hash: this.hashCode(code),
            attempts: 0,
            lockedUntil: 0,
        };

        const client = await this.getClient();
        const key = this.key(phone);

        if (client) {
            await client.set(key, JSON.stringify(payload), { EX: ttlSeconds });
            return payload.hash;
        }

        this.fallback.set(key, payload);
        return payload.hash;
    }

    async verifyOtp(phone: string, code: string) {
        const payload = await this.getRecord(phone);
        if (!payload) {
            return { ok: false, locked: false };
        }

        const now = Date.now();
        if (payload.lockedUntil > now) {
            return { ok: false, locked: true };
        }

        const isMatch = payload.hash === this.hashCode(code);
        if (!isMatch) {
            const nextAttempts = payload.attempts + 1;
            const nextPayload = { ...payload, attempts: nextAttempts };
            await this.putRecord(phone, nextPayload);

            if (nextAttempts >= 3) {
                const lockedUntil = now + 30 * 60 * 1000;
                await this.putRecord(phone, { ...nextPayload, lockedUntil });
                return { ok: false, locked: true };
            }

            return { ok: false, locked: false };
        }

        await this.clear(phone);
        return { ok: true, locked: false };
    }

    async clear(phone: string) {
        const client = await this.getClient();
        const key = this.key(phone);
        if (client) {
            await client.del(key);
            return;
        }

        this.fallback.delete(key);
    }

    private key(phone: string) {
        return `otp:${phone}`;
    }

    private hashCode(code: string) {
        return createHash('sha256').update(code).digest('hex');
    }

    private async getClient() {
        // If onModuleInit already connected, reuse the existing client.
        if (this.client) {
            return this.client;
        }

        // In non-production, attempt a lazy connection but fall back gracefully.
        const redisUrl =
            this.configService.get<string>('REDIS_URL') ||
            this.configService.get<string>('REDIS_HOST');
        if (redisUrl) {
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

    private async getRecord(phone: string): Promise<OtpRecord | null> {
        const client = await this.getClient();
        const key = this.key(phone);
        if (client) {
            const raw = await client.get(key);
            return raw ? JSON.parse(raw) as OtpRecord : null;
        }

        return this.fallback.get(key) ?? null;
    }

    private async putRecord(phone: string, payload: OtpRecord) {
        const client = await this.getClient();
        const key = this.key(phone);
        if (client) {
            await client.set(key, JSON.stringify(payload));
            return;
        }

        this.fallback.set(key, payload);
    }
}
