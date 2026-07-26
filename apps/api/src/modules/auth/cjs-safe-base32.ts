import type { Base32Plugin } from '@otplib/core';

// otplib's official ScureBase32Plugin pulls in @scure/base, which is
// pure ESM (`"type": "module"` with no CJS export). Vercel's serverless
// bundler packages everything as CommonJS, and @otplib/plugin-base32-scure's
// compiled .cjs file does a plain `require('@scure/base')` — which Node
// refuses at runtime with ERR_REQUIRE_ESM. That crash happened on every
// request, not just admin-login ones, because Nest builds its whole
// dependency-injection graph (including AdminAuthService, which imports
// otplib) on startup, regardless of which route was actually hit.
//
// Base32 (RFC 4648, no padding) is simple enough to implement directly with
// zero dependencies, sidestepping the ESM/CJS conflict entirely.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encode(data: Uint8Array): string {
    let bits = '';
    for (const byte of data) bits += byte.toString(2).padStart(8, '0');

    let output = '';
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.slice(i, i + 5).padEnd(5, '0');
        output += ALPHABET[parseInt(chunk, 2)];
    }
    return output;
}

function decode(str: string): Uint8Array {
    const clean = str.toUpperCase().replace(/=+$/, '');

    let bits = '';
    for (const char of clean) {
        const val = ALPHABET.indexOf(char);
        if (val === -1) {
            throw new Error(`Invalid base32 character: ${char}`);
        }
        bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return new Uint8Array(bytes);
}

export const CjsSafeBase32Plugin: Base32Plugin = {
    name: 'cjs-safe',
    encode,
    decode,
};
