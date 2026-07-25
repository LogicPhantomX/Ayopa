import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FixMissingIdDefaults
 *
 * The very first migration (CreatePhaseBullCoreTables) created users,
 * user_profiles, listings, and transactions with `id UUID PRIMARY KEY` and
 * no DEFAULT expression. Every other table created later (kyc_profiles,
 * audit_logs, etc.) correctly got `DEFAULT uuid_generate_v4()`.
 *
 * Because the entities use @PrimaryGeneratedColumn('uuid'), TypeORM assumes
 * the database itself generates the id and sends the literal SQL keyword
 * DEFAULT for that column on every INSERT. With no column default, Postgres
 * evaluates that to NULL and the insert fails:
 *   error: null value in column "id" of relation "users" violates not-null constraint
 *
 * This breaks every code path that creates a row via repository.save()
 * without manually setting an id first — user registration, phone-OTP
 * signup, and listing creation all 500 on a fresh database.
 */
export class FixMissingIdDefaults1710000000007 implements MigrationInterface {
    name = 'FixMissingIdDefaults1710000000007';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make sure the function these defaults call actually exists — earlier
        // migrations assumed it, but nothing ever created it explicitly.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`);
    }
}
