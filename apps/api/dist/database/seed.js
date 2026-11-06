"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("./data-source");
const bcrypt = __importStar(require("bcrypt"));
const ADMIN_EMAIL = 'admin@ayopa.test';
const ADMIN_PASSWORD = 'ChangeMe123!';
const SELLER_EMAIL = 'seller@ayopa.test';
const SELLER_PASSWORD = 'ChangeMe123!';
async function seed() {
    await data_source_1.AppDataSource.initialize();
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const sellerHash = await bcrypt.hash(SELLER_PASSWORD, 12);
    await data_source_1.AppDataSource.query(`
        INSERT INTO users (id, email, password_hash, full_name, role, is_active, is_verified)
        VALUES (uuid_generate_v4(), $1, $2, 'Ayopa Admin', 'admin', true, true)
        ON CONFLICT (email) DO NOTHING
        `, [ADMIN_EMAIL, adminHash]);
    const sellerResult = await data_source_1.AppDataSource.query(`
        INSERT INTO users (id, email, password_hash, full_name, role, is_active, is_verified)
        VALUES (uuid_generate_v4(), $1, $2, 'Sample Seller', 'seller', true, true)
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id
        `, [SELLER_EMAIL, sellerHash]);
    const sellerId = sellerResult[0].id;
    const listings = [
        ['Healthy Adult Cow', 'Well-fed Friesian cow, 3 years old, vaccinated.', 'Cows', 450000, 'Ogbomoso, Oyo State'],
        ['White Dwarf Goat', 'Young dwarf goat, great for breeding.', 'Goats', 65000, 'Ogbomoso, Oyo State'],
        ['Ram for Sallah', 'Large ram, well-fed, ready for slaughter.', 'Rams', 180000, 'Ibadan, Oyo State'],
        ['Broiler Chickens (x10)', 'Batch of 10 healthy broiler chickens.', 'Chickens', 45000, 'Lagos, Lagos State'],
        ['Merino Sheep', 'Adult merino sheep, good wool quality.', 'Sheep', 220000, 'Kano, Kano State'],
    ];
    for (const [title, description, category, price, location] of listings) {
        await data_source_1.AppDataSource.query(`
            INSERT INTO listings (id, seller_id, title, description, category, price, currency, location, status)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'NGN', $6, 'active')
            `, [sellerId, title, description, category, price, location]);
    }
    console.log('Seed complete.');
    console.log(`Admin login  -> email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
    console.log(`Seller login -> email: ${SELLER_EMAIL}  password: ${SELLER_PASSWORD}`);
    console.log(`Inserted ${listings.length} sample listings.`);
    await data_source_1.AppDataSource.destroy();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map