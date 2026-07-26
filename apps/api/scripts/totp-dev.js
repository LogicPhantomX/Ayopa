#!/usr/bin/env node
/**
 * Dev-only helper: prints the current TOTP code for a given secret, the same
 * way an authenticator app would. Useful for testing the admin login flow
 * without needing your phone.
 *
 * Usage:
 *   node scripts/totp-dev.js <secret>            → print current code once
 *   node scripts/totp-dev.js <secret> --watch     → refresh every second like a live authenticator
 *
 * Requires otplib (already a dependency of apps/api).
 */

const { TOTP } = require('@otplib/totp');
const nodeCrypto = require('crypto');

// Same native-crypto plugin used in src/modules/auth/node-crypto-plugin.ts —
// kept inline here since this is a standalone script. NobleCryptoPlugin
// (otplib's default) pulls in @noble/hashes, a pure-ESM package that
// crashes under Vercel's CommonJS bundling; this avoids that entirely.
const cryptoPlugin = {
    name: 'node-native',
    hmac(algorithm, key, data) {
        return new Uint8Array(
            nodeCrypto.createHmac(algorithm, Buffer.from(key)).update(Buffer.from(data)).digest()
        );
    },
    randomBytes(length) {
        return new Uint8Array(nodeCrypto.randomBytes(length));
    },
    constantTimeEqual(a, b) {
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        if (bufA.length !== bufB.length) return false;
        return nodeCrypto.timingSafeEqual(bufA, bufB);
    },
};

// Same dependency-free base32 implementation used in
// src/modules/auth/cjs-safe-base32.ts — kept inline here since this is a
// standalone script. ScureBase32Plugin (otplib's default) pulls in
// @scure/base, a pure-ESM package that crashes under Vercel's CommonJS
// bundling; this avoids that entirely.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function encode(data) {
    let bits = '';
    for (const byte of data) bits += byte.toString(2).padStart(8, '0');
    let output = '';
    for (let i = 0; i < bits.length; i += 5) {
        output += ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
    }
    return output;
}
function decode(str) {
    const clean = str.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (const char of clean) {
        const val = ALPHABET.indexOf(char);
        if (val === -1) throw new Error('Invalid base32 character: ' + char);
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return new Uint8Array(bytes);
}
const base32Plugin = { name: 'cjs-safe', encode, decode };

const secret = process.argv[2];
const watch = process.argv.includes('--watch');

if (!secret) {
    console.error('Usage: node scripts/totp-dev.js <secret> [--watch]');
    process.exit(1);
}

const totp = new TOTP({ crypto: cryptoPlugin, base32: base32Plugin });

async function printCode() {
    const code = await totp.generate({ secret });
    const secondsLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
    if (watch) {
        process.stdout.write(`\rTOTP: ${code}  (rotates in ${String(secondsLeft).padStart(2, ' ')}s)   `);
    } else {
        console.log(code);
    }
}

if (watch) {
    console.log(`Watching TOTP for secret ${secret} — Ctrl+C to stop\n`);
    printCode();
    setInterval(printCode, 1000);
} else {
    printCode();
}
