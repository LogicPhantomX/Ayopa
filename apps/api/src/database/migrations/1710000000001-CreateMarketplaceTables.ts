import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the marketplace tables that KycProfile, EscrowEvent, Dispute and
 * Payment entities map to, but that no earlier migration ever created.
 * Column names/types are taken directly from:
 *   - modules/kyc/entities/kyc-profile.entity.ts
 *   - modules/escrow/entities/escrow-event.entity.ts
 *   - modules/disputes/entities/dispute.entity.ts
 *   - modules/payments/entities/payment.entity.ts
 */
export class CreateMarketplaceTables1710000000001 implements MigrationInterface {
  name = 'CreateMarketplaceTables1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS disputes;
      DROP TABLE IF EXISTS escrow_events;
      DROP TABLE IF EXISTS kyc_profiles;
    `);
  }
}