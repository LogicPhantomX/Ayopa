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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpStore = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const redis_1 = require("redis");
let OtpStore = class OtpStore {
    configService;
    client = null;
    fallback = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        if (isProduction) {
            const redisUrl = this.configService.get('REDIS_URL');
            if (!redisUrl) {
                throw new Error('[OtpStore] REDIS_URL is required in production. The in-memory OTP fallback is not safe for production use.');
            }
            try {
                this.client = (0, redis_1.createClient)({ url: redisUrl });
                this.client.on('error', (err) => {
                    console.error('[OtpStore] Redis client error:', err.message);
                });
                await this.client.connect();
            }
            catch (err) {
                throw new Error(`[OtpStore] Failed to connect to Redis in production — refusing to start. ` +
                    `Ensure Redis is reachable at REDIS_URL. Original error: ${err?.message ?? err}`);
            }
        }
    }
    async setOtp(phone, code, ttlSeconds = 300) {
        const payload = {
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
    async verifyOtp(phone, code) {
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
    async clear(phone) {
        const client = await this.getClient();
        const key = this.key(phone);
        if (client) {
            await client.del(key);
            return;
        }
        this.fallback.delete(key);
    }
    key(phone) {
        return `otp:${phone}`;
    }
    hashCode(code) {
        return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
    }
    async getClient() {
        if (this.client) {
            return this.client;
        }
        const redisUrl = this.configService.get('REDIS_URL') ||
            this.configService.get('REDIS_HOST');
        if (redisUrl) {
            try {
                this.client = (0, redis_1.createClient)({ url: this.configService.get('REDIS_URL') });
                await this.client.connect();
                return this.client;
            }
            catch {
                this.client = null;
            }
        }
        return null;
    }
    async getRecord(phone) {
        const client = await this.getClient();
        const key = this.key(phone);
        if (client) {
            const raw = await client.get(key);
            return raw ? JSON.parse(raw) : null;
        }
        return this.fallback.get(key) ?? null;
    }
    async putRecord(phone, payload) {
        const client = await this.getClient();
        const key = this.key(phone);
        if (client) {
            await client.set(key, JSON.stringify(payload));
            return;
        }
        this.fallback.set(key, payload);
    }
};
exports.OtpStore = OtpStore;
exports.OtpStore = OtpStore = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OtpStore);
//# sourceMappingURL=otp-store.js.map