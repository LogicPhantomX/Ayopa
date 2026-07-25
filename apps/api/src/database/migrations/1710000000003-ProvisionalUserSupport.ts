import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ProvisionalUserSupport
 *
 * Enables Option C onboarding (phone-OTP auto-register):
 *   1. Makes password_hash nullable  — provisional users never set a password.
 *   2. Makes full_name nullable       — set during profile/setup.
 *   3. Changes default role to 'provisional' (was 'user').
 *   4. Adds 'provisional' to the user_role CHECK constraint so the DB itself
 *      rejects unknown role strings.
 */
export class ProvisionalUserSupport1710000000003 implements MigrationInterface {
    name = 'ProvisionalUserSupport1710000000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Make password_hash nullable
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "password_hash" DROP NOT NULL
        `);

        // 2. Make full_name nullable
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "full_name" DROP NOT NULL
        `);

        // 3. Change default role to 'provisional'
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "role" SET DEFAULT 'provisional'
        `);

        // 4. Drop any existing role CHECK and add the canonical one
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP CONSTRAINT IF EXISTS "users_role_check"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "users_role_check"
            CHECK (role IN ('provisional', 'buyer', 'seller', 'admin'))
        `);

        // 5. Migrate legacy 'user' role (created before this migration) to 'buyer'
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'buyer' WHERE "role" = 'user'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse role migration (best-effort; promotes buyers back to 'user')
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'user' WHERE "role" = 'buyer'
        `);

        await queryRunner.query(`
            ALTER TABLE "users"
            DROP CONSTRAINT IF EXISTS "users_role_check"
        `);

        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "role" SET DEFAULT 'user'
        `);

        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "full_name" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "password_hash" SET NOT NULL
        `);
    }
}
