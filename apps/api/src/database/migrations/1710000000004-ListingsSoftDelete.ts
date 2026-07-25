import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Part 2 — Item 3: Listings soft delete
 *
 * Adds a nullable `deleted_at TIMESTAMPTZ` column to the `listings` table.
 * TypeORM's @DeleteDateColumn decorator uses this column to implement soft
 * deletes: rows with a non-null `deleted_at` are treated as deleted for
 * standard queries but remain in the database and are queryable by admins
 * using withDeleted().
 */
export class ListingsSoftDelete1710000000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
        `);

        // Index speeds up admin queries that filter on deleted_at IS NOT NULL.
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_listings_deleted_at"
            ON "listings" ("deleted_at")
            WHERE "deleted_at" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_listings_deleted_at"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "deleted_at"`);
    }
}
