import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(page?: string, limit?: string): Promise<import("./audit.service").AuditLogPage>;
}
