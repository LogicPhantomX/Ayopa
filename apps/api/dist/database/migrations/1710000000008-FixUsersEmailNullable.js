"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixUsersEmailNullable1710000000008 = void 0;
class FixUsersEmailNullable1710000000008 {
    name = 'FixUsersEmailNullable1710000000008';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`);
    }
}
exports.FixUsersEmailNullable1710000000008 = FixUsersEmailNullable1710000000008;
//# sourceMappingURL=1710000000008-FixUsersEmailNullable.js.map