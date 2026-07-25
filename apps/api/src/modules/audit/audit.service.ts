import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

// ── Item 4: Audit log pagination ──────────────────────────────────────────────

export interface AuditLogPage {
    items: AuditLog[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
    ) { }

    /**
     * Append an audit log entry.
     *
     * @param entityType  The domain entity type (e.g. 'payment', 'kyc').
     * @param action      The action performed (e.g. 'created', 'status_updated').
     * @param actorId     UUID of the user who performed the action (optional).
     * @param newData     The new/resulting state or metadata (mapped to `new_data`).
     * @param entityId    The ID of the affected entity (defaults to '' when unknown).
     * @param oldData     The previous state before the action (mapped to `old_data`).
     * @param ipAddress   The originating IP address, if available.
     */
    async log(
        entityType: string,
        action: string,
        actorId?: string | null,
        newData?: Record<string, any> | null,
        entityId = '',
        oldData?: Record<string, any> | null,
        ipAddress?: string | null,
    ) {
        const entry = this.auditLogRepository.create({
            entityType,
            action,
            actorId: actorId ?? null,
            entityId,
            newData: newData ?? null,
            oldData: oldData ?? null,
            ipAddress: ipAddress ?? null,
        });
        return this.auditLogRepository.save(entry);
    }

    /**
     * Paginated audit log listing.
     *
     * @param page   1-based page number (default 1)
     * @param limit  Records per page (default 50, max 200)
     */
    async findAll(page = 1, limit = 50): Promise<AuditLogPage> {
        const safeLimit = Math.min(limit, 200);
        const [items, total] = await this.auditLogRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * safeLimit,
            take: safeLimit,
        });

        return {
            items,
            meta: {
                page,
                limit: safeLimit,
                total,
                totalPages: Math.ceil(total / safeLimit),
            },
        };
    }
}
