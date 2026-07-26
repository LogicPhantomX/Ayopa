import type { CryptoPlugin } from '@otplib/core';
import * as crypto from 'crypto';

// otplib's official NobleCryptoPlugin pulls in @noble/hashes, which is pure
// ESM. Vercel's serverless bundler packages everything as CommonJS, and
// @otplib/plugin-crypto-noble's compiled .cjs file does a plain
// `require('@noble/hashes/hmac.js')` — which Node refuses at runtime with
// ERR_REQUIRE_ESM. Same category of bug as the base32 plugin
// (cjs-safe-base32.ts) fixed earlier for the same reason.
//
// HMAC, random bytes, and constant-time comparison are all things Node's
// built-in `crypto` module already does natively — no external package
// needed, so there's nothing here that can ever hit an ESM/CJS conflict.

export const NodeCryptoPlugin: CryptoPlugin = {
    name: 'node-native',

    hmac(algorithm, key, data) {
        return new Uint8Array(
            crypto.createHmac(algorithm, Buffer.from(key)).update(Buffer.from(data)).digest(),
        );
    },

    randomBytes(length) {
        return new Uint8Array(crypto.randomBytes(length));
    },

    constantTimeEqual(a, b) {
        const bufA = Buffer.from(a as any);
        const bufB = Buffer.from(b as any);
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
    },
};
