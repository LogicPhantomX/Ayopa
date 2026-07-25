import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Part 3 — Dual-approval payout tables.
 *
 * payout_requests  — one row per large payout that requires dual-admin approval
 * payout_approvals — one row per admin approval, FK → payout_requests
 */
export class PayoutApprovalTables1710000000005 implements MigrationInterface {
    name = 'PayoutApprovalTables1710000000005';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── payout_requests ─────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payout_requests" (
                "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
                "recipient_code"  VARCHAR(100) NOT NULL,
                "amount"          BIGINT       NOT NULL,
                "reason"          VARCHAR(255) NOT NULL DEFAULT '',
                "status"          VARCHAR(50)  NOT NULL DEFAULT 'pending',
                "transfer_code"   VARCHAR(100),
                "requested_by"    UUID        NOT NULL,
                "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "pk_payout_requests" PRIMARY KEY ("id")
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_payout_requests_status"
                ON "payout_requests" ("status");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_payout_requests_requested_by"
                ON "payout_requests" ("requested_by");
        `);

        // ── payout_approvals ────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payout_approvals" (
                "id"                  UUID        NOT NULL DEFAULT gen_random_uuid(),
                "payout_request_id"   UUID        NOT NULL,
                "approved_by"         UUID        NOT NULL,
                "comment"             VARCHAR(255),
                "approved_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "pk_payout_approvals" PRIMARY KEY ("id"),
                CONSTRAINT "fk_payout_approvals_request"
                    FOREIGN KEY ("payout_request_id")
                    REFERENCES "payout_requests" ("id")
                    ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_payout_approvals_request_id"
                ON "payout_approvals" ("payout_request_id");
        `);

        // Unique constraint: one approval per admin per request
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_payout_approvals_admin_request"
                ON "payout_approvals" ("payout_request_id", "approved_by");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "payout_approvals";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payout_requests";`);
    }
}
