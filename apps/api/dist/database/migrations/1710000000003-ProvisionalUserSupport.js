"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisionalUserSupport1710000000003 = void 0;
class ProvisionalUserSupport1710000000003 {
    name = 'ProvisionalUserSupport1710000000003';
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "password_hash" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "full_name" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "role" SET DEFAULT 'provisional'
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP CONSTRAINT IF EXISTS "users_role_check"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "users_role_check"
            CHECK (role IN ('provisional', 'buyer', 'seller', 'admin'))
        `);
        await queryRunner.query(`
            UPDATE "users" SET "role" = 'buyer' WHERE "role" = 'user'
        `);
    }
    async down(queryRunner) {
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
exports.ProvisionalUserSupport1710000000003 = ProvisionalUserSupport1710000000003;
//# sourceMappingURL=1710000000003-ProvisionalUserSupport.js.map