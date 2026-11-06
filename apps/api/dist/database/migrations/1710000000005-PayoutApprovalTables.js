"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutApprovalTables1710000000005 = void 0;
class PayoutApprovalTables1710000000005 {
    name = 'PayoutApprovalTables1710000000005';
    async up(queryRunner) {
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
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_payout_approvals_admin_request"
                ON "payout_approvals" ("payout_request_id", "approved_by");
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "payout_approvals";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payout_requests";`);
    }
}
exports.PayoutApprovalTables1710000000005 = PayoutApprovalTables1710000000005;
//# sourceMappingURL=1710000000005-PayoutApprovalTables.js.map