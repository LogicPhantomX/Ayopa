import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ProvisionalUserSupport1710000000003 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
