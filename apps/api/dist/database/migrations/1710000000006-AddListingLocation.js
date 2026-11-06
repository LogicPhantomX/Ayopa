"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddListingLocation1710000000006 = void 0;
class AddListingLocation1710000000006 {
    name = 'AddListingLocation1710000000006';
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD COLUMN IF NOT EXISTS "location" TEXT;
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "listings"
            DROP COLUMN IF EXISTS "location";
        `);
    }
}
exports.AddListingLocation1710000000006 = AddListingLocation1710000000006;
//# sourceMappingURL=1710000000006-AddListingLocation.js.map