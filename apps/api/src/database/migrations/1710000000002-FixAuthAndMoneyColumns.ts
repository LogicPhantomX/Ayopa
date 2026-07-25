import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAuthAndMoneyColumns1710000000002 implements MigrationInterface {
    name = 'FixAuthAndMoneyColumns1710000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Fix listings.price precision
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "price" TYPE NUMERIC(15,2)`);

        // 2. Add missing columns to users table for admin auth and lockout
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "admin_totp_secret" character varying(255)`);

        // 3. Ensure phone is unique
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_phone" UNIQUE ("phone")`);

        // 4. Fix kyc_profiles timestamps to include time zone
        await queryRunner.query(`ALTER TABLE "kyc_profiles" ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "kyc_profiles" ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE`);

        // 5. Create audit_logs table if it doesn't exist and add append-only trigger
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "actor_id" uuid,
                "action" character varying(255) NOT NULL,
                "entity_type" character varying(255) NOT NULL,
                "entity_id" character varying(255) NOT NULL,
                "old_data" jsonb,
                "new_data" jsonb,
                "ip_address" character varying(50),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION block_audit_log_delete_or_update()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'audit_logs table is append-only';
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON audit_logs;
            CREATE TRIGGER trg_audit_logs_append_only
            BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION block_audit_log_delete_or_update();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON audit_logs`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS block_audit_log_delete_or_update`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "admin_totp_secret"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locked_until"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failed_login_attempts"`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "price" TYPE NUMERIC(12,2)`);
    }
}
