// The issue is that otplib/dist/functional.cjs -> require("@otplib/plugin-base32-scure")
// -> resolves to @otplib/plugin-base32-scure/dist/index.cjs
// -> require("@scure/base") -> resolves to @scure/base/index.js (ESM)
// 
// The @scure/base package has "type": "module" and its index.js uses ESM syntax
// but it doesn't have a "require" export map entry, so Node resolves to index.js
// which is ESM and can't be required.
//
// Solution: mock the entire otplib dependency in tests since we can mock the service

const path = require('path');
const resolved = require.resolve('@scure/base');
console.log('Resolved @scure/base to:', resolved);

// Check if there's a CJS version
const fs = require('fs');
const pkgDir = path.dirname(resolved);
console.log('Files in @scure/base:', fs.readdirSync(pkgDir));
