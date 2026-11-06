"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMarketplaceTables1710000000001 = void 0;
class CreateMarketplaceTables1710000000001 {
    name = 'CreateMarketplaceTables1710000000001';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS kyc_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        id_type VARCHAR(50),
        id_number VARCHAR(255),
        oci_bucket_path VARCHAR(500),
        status VARCHAR(255) NOT NULL DEFAULT 'pending',
        virus_scan_passed BOOLEAN NOT NULL DEFAULT false,
        verification_details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS escrow_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        actor_id UUID,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS disputes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE RESTRICT,
        initiator_id UUID NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        status VARCHAR(255) NOT NULL DEFAULT 'open',
        response_deadline TIMESTAMPTZ NOT NULL,
        appeal_count INTEGER NOT NULL DEFAULT 0,
        resolution_summary TEXT,
        seller_response TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
        provider VARCHAR(100) NOT NULL DEFAULT 'pending',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        reference TEXT,
        amount NUMERIC(12,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS disputes;
      DROP TABLE IF EXISTS escrow_events;
      DROP TABLE IF EXISTS kyc_profiles;
    `);
    }
}
exports.CreateMarketplaceTables1710000000001 = CreateMarketplaceTables1710000000001;
//# sourceMappingURL=1710000000001-CreateMarketplaceTables.js.map