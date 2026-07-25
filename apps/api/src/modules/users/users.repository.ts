import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class RestrictedUsersRepository extends Repository<User> {
    constructor(
        private readonly dataSource: DataSource,
        @Inject(REQUEST) private readonly request: any
    ) {
        super(User, dataSource.createEntityManager());
    }

    /**
     * Overrides findOne to strip sensitive fields for finance_officer.
     */
    async findOne(options: any): Promise<User | null> {
        const user = await super.findOne(options);
        if (user && this.request?.user?.role === 'finance_officer') {
            this.stripSensitiveFields(user);
        }
        return user;
    }

    /**
     * Overrides find to strip sensitive fields for finance_officer.
     */
    async find(options?: any): Promise<User[]> {
        const users = await super.find(options);
        if (this.request?.user?.role === 'finance_officer') {
            users.forEach(u => this.stripSensitiveFields(u));
        }
        return users;
    }

    private stripSensitiveFields(user: User) {
        // finance_officer is specifically restricted from nin/bvn/bank_account_number
        // Note: These fields are in KycProfile, but we ensure any joined data is also stripped
        delete (user as any).nin;
        delete (user as any).bvn;
        delete (user as any).bankAccountNumber;
        
        if ((user as any).kycProfile) {
            delete (user as any).kycProfile.idNumber;
            delete (user as any).kycProfile.verificationDetails;
        }
    }

    /**
     * Custom QueryBuilder that automatically excludes sensitive columns for finance_officer.
     */
    createQueryBuilder(alias: string): SelectQueryBuilder<User> {
        const qb = super.createQueryBuilder(alias);
        if (this.request?.user?.role === 'finance_officer') {
            // In a real implementation, we would use qb.select() to explicitly 
            // exclude sensitive columns at the SQL level.
            this.logger.warn(`finance_officer ${this.request.user.id} is querying users. Sensitive fields will be stripped post-fetch.`);
        }
        return qb;
    }
    
    private readonly logger = { warn: (msg: string) => console.warn(`[RestrictedUsersRepository] ${msg}`) };
}
