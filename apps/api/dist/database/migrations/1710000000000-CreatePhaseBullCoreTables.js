"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePhaseBullCoreTables1710000000000 = void 0;
class CreatePhaseBullCoreTables1710000000000 {
    name = 'CreatePhaseBullCoreTables1710000000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        country VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        city VARCHAR(100),
        address TEXT,
        bio TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS listings (
        id UUID PRIMARY KEY,
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        is_featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY,
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS listings;
      DROP TABLE IF EXISTS user_profiles;
      DROP TABLE IF EXISTS users;
    `);
    }
}
exports.CreatePhaseBullCoreTables1710000000000 = CreatePhaseBullCoreTables1710000000000;
//# sourceMappingURL=1710000000000-CreatePhaseBullCoreTables.js.map