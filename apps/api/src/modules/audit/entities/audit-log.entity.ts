import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Maps to the `audit_logs` table created by migration
 * 20260721000000-FixAuthAndMoneyColumns.
 *
 * Migration is the source of truth — all column names and types below must
 * match that migration exactly.
 */
@Entity({ name: 'audit_logs' })
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'actor_id', type: 'uuid', nullable: true })
    actorId: string | null;

    @Column({ name: 'action', length: 255 })
    action: string;

    @Column({ name: 'entity_type', length: 255 })
    entityType: string;

    @Column({ name: 'entity_id', length: 255 })
    entityId: string;

    @Column({ name: 'old_data', type: 'jsonb', nullable: true })
    oldData: Record<string, any> | null;

    @Column({ name: 'new_data', type: 'jsonb', nullable: true })
    newData: Record<string, any> | null;

    @Column({ name: 'ip_address', length: 50, nullable: true })
    ipAddress: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
