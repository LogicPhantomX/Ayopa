import { AppDataSource } from './data-source';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@ayopa.test';
const ADMIN_PASSWORD = 'ChangeMe123!';

const SELLER_EMAIL = 'seller@ayopa.test';
const SELLER_PASSWORD = 'ChangeMe123!';

async function seed() {
    await AppDataSource.initialize();

    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const sellerHash = await bcrypt.hash(SELLER_PASSWORD, 12);

    // --- Admin user ---
    await AppDataSource.query(
        `
        INSERT INTO users (id, email, password_hash, full_name, role, is_active, is_verified)
        VALUES (uuid_generate_v4(), $1, $2, 'Ayopa Admin', 'admin', true, true)
        ON CONFLICT (email) DO NOTHING
        `,
        [ADMIN_EMAIL, adminHash],
    );

    // --- Seller user (needed as seller_id FK for sample listings) ---
    const sellerResult = await AppDataSource.query(
        `
        INSERT INTO users (id, email, password_hash, full_name, role, is_active, is_verified)
        VALUES (uuid_generate_v4(), $1, $2, 'Sample Seller', 'seller', true, true)
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id
        `,
        [SELLER_EMAIL, sellerHash],
    );
    const sellerId = sellerResult[0].id;

    // --- Sample listings ---
    const listings = [
        ['Healthy Adult Cow', 'Well-fed Friesian cow, 3 years old, vaccinated.', 'Cows', 450000, 'Ogbomoso, Oyo State'],
        ['White Dwarf Goat', 'Young dwarf goat, great for breeding.', 'Goats', 65000, 'Ogbomoso, Oyo State'],
        ['Ram for Sallah', 'Large ram, well-fed, ready for slaughter.', 'Rams', 180000, 'Ibadan, Oyo State'],
        ['Broiler Chickens (x10)', 'Batch of 10 healthy broiler chickens.', 'Chickens', 45000, 'Lagos, Lagos State'],
        ['Merino Sheep', 'Adult merino sheep, good wool quality.', 'Sheep', 220000, 'Kano, Kano State'],
    ];

    for (const [title, description, category, price, location] of listings) {
        await AppDataSource.query(
            `
            INSERT INTO listings (id, seller_id, title, description, category, price, currency, location, status)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'NGN', $6, 'active')
            `,
            [sellerId, title, description, category, price, location],
        );
    }

    console.log('Seed complete.');
    console.log(`Admin login  -> email: ${ADMIN_EMAIL}  password: ${ADMIN_PASSWORD}`);
    console.log(`Seller login -> email: ${SELLER_EMAIL}  password: ${SELLER_PASSWORD}`);
    console.log(`Inserted ${listings.length} sample listings.`);

    await AppDataSource.destroy();
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
