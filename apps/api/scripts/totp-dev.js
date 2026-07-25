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

const { TOTP, NobleCryptoPlugin, ScureBase32Plugin } = require('otplib');

const secret = process.argv[2];
const watch = process.argv.includes('--watch');

if (!secret) {
    console.error('Usage: node scripts/totp-dev.js <secret> [--watch]');
    process.exit(1);
}

const totp = new TOTP({ crypto: new NobleCryptoPlugin(), base32: new ScureBase32Plugin() });

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
