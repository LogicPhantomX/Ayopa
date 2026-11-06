export declare class AuditLog {
    id: string;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    oldData: Record<string, any> | null;
    newData: Record<string, any> | null;
    ipAddress: string | null;
    createdAt: Date;
}
