"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CjsSafeBase32Plugin = void 0;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function encode(data) {
    let bits = '';
    for (const byte of data)
        bits += byte.toString(2).padStart(8, '0');
    let output = '';
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.slice(i, i + 5).padEnd(5, '0');
        output += ALPHABET[parseInt(chunk, 2)];
    }
    return output;
}
function decode(str) {
    const clean = str.toUpperCase().replace(/=+$/, '');
    let bits = '';
    for (const char of clean) {
        const val = ALPHABET.indexOf(char);
        if (val === -1) {
            throw new Error(`Invalid base32 character: ${char}`);
        }
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return new Uint8Array(bytes);
}
exports.CjsSafeBase32Plugin = {
    name: 'cjs-safe',
    encode,
    decode,
};
//# sourceMappingURL=cjs-safe-base32.js.map