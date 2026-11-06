"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsSoftDelete1710000000004 = void 0;
class ListingsSoftDelete1710000000004 {
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_listings_deleted_at"
            ON "listings" ("deleted_at")
            WHERE "deleted_at" IS NOT NULL
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listings_deleted_at"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "deleted_at"`);
    }
}
exports.ListingsSoftDelete1710000000004 = ListingsSoftDelete1710000000004;
//# sourceMappingURL=1710000000004-ListingsSoftDelete.js.map