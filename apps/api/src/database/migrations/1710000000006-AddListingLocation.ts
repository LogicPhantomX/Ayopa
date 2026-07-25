import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The Listing entity declares a nullable `location: string` column, but the
 * original CreatePhaseBullCoreTables migration never created it on the
 * `listings` table. This adds the missing column.
 */
export class AddListingLocation1710000000006 implements MigrationInterface {
    name = 'AddListingLocation1710000000006';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD COLUMN IF NOT EXISTS "location" TEXT;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings"
            DROP COLUMN IF EXISTS "location";
        `);
    }
}
