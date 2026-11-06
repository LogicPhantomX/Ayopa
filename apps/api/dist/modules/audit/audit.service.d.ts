import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export interface AuditLogPage {
    items: AuditLog[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class AuditService {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    log(entityType: string, action: string, actorId?: string | null, newData?: Record<string, any> | null, entityId?: string, oldData?: Record<string, any> | null, ipAddress?: string | null): Promise<AuditLog>;
    findAll(page?: number, limit?: number): Promise<AuditLogPage>;
}
