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
exports.RefreshTokenStore = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const redis_1 = require("redis");
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;
let RefreshTokenStore = class RefreshTokenStore {
    configService;
    client = null;
    fallback = new Map();
    fallbackByUser = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    async issue(userId, ttlSeconds = DEFAULT_TTL_SECONDS) {
        const token = (0, crypto_1.randomBytes)(48).toString('hex');
        const hashedToken = this.hash(token);
        const key = this.key(hashedToken);
        const record = { userId, createdAt: Date.now() };
        const client = await this.getClient();
        if (client) {
            await client.set(key, JSON.stringify(record), { EX: ttlSeconds });
            await client.sAdd(this.userSetKey(userId), hashedToken);
            await client.expire(this.userSetKey(userId), ttlSeconds);
            return token;
        }
        this.fallback.set(key, record);
        const set = this.fallbackByUser.get(userId) ?? new Set();
        set.add(hashedToken);
        this.fallbackByUser.set(userId, set);
        return token;
    }
    async consume(token) {
        const hashedToken = this.hash(token);
        const key = this.key(hashedToken);
        const client = await this.getClient();
        if (client) {
            const raw = await client.get(key);
            if (!raw) {
                return null;
            }
            const record = JSON.parse(raw);
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
    async revokeAllForUser(userId) {
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
    hash(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    key(hashedToken) {
        return `refresh:${hashedToken}`;
    }
    userSetKey(userId) {
        return `refresh:user:${userId}`;
    }
    async getClient() {
        if (this.client) {
            return this.client;
        }
        if (this.configService.get('REDIS_URL') || this.configService.get('REDIS_HOST')) {
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
};
exports.RefreshTokenStore = RefreshTokenStore;
exports.RefreshTokenStore = RefreshTokenStore = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RefreshTokenStore);
//# sourceMappingURL=refresh-token-store.js.map