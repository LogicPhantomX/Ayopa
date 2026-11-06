import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class FixMissingIdDefaults1710000000007 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
