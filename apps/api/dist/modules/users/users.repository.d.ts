import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './entities/user.entity';
export declare class RestrictedUsersRepository extends Repository<User> {
    private readonly dataSource;
    private readonly request;
    constructor(dataSource: DataSource, request: any);
    findOne(options: any): Promise<User | null>;
    find(options?: any): Promise<User[]>;
    private stripSensitiveFields;
    createQueryBuilder(alias: string): SelectQueryBuilder<User>;
    private readonly logger;
}
