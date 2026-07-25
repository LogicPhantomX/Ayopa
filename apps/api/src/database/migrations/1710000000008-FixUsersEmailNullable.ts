import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * FixUsersEmailNullable
 *
 * ProvisionalUserSupport (1710000000003) enabled phone-OTP signup and
 * correctly dropped NOT NULL on password_hash and full_name, since
 * provisional accounts have neither yet — but it missed doing the same for
 * email. The original CreatePhaseBullCoreTables migration left
 * `email VARCHAR(255) NOT NULL UNIQUE`, so every phone-only signup
 * (verifyPhoneOtp inserting email: null) has been failing with:
 *   error: null value in column "email" of relation "users" violates not-null constraint
 */
export class FixUsersEmailNullable1710000000008 implements MigrationInterface {
    name = 'FixUsersEmailNullable1710000000008';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
    }
}
