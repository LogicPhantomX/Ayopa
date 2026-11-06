"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixMissingIdDefaults1710000000007 = void 0;
class FixMissingIdDefaults1710000000007 {
    name = 'FixMissingIdDefaults1710000000007';
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`);
    }
}
exports.FixMissingIdDefaults1710000000007 = FixMissingIdDefaults1710000000007;
//# sourceMappingURL=1710000000007-FixMissingIdDefaults.js.map