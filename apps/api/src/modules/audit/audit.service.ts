import { Injectable } from '@nestjs/common';
import { getPool } from '../../infra/db/db.js';
import { getTenantContext } from '../../infra/db/tenant-context.js';

export type AuditRecordInput = {
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  correlationId?: string;
};

@Injectable()
export class AuditService {
  async record(input: AuditRecordInput): Promise<{ id: string }> {
    const ctx = getTenantContext();
    const pool = getPool();
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO audit_events (id, tenant_id, actor_id, action, entity_type, entity_id, before, after, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, ctx.tenantId, ctx.actorId ?? null, input.action, input.entityType, input.entityId, input.before ? JSON.stringify(input.before) : null, input.after ? JSON.stringify(input.after) : null, input.correlationId ?? ctx.correlationId ?? null],
    );
    return { id };
  }

  async list(entityType: string, entityId: string, limit = 50): Promise<Record<string, unknown>[]> {
    const ctx = getTenantContext();
    const pool = getPool();
    const res = await pool.query(
      `SELECT * FROM audit_events WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3 ORDER BY created_at DESC LIMIT $4`,
      [ctx.tenantId, entityType, entityId, limit],
    );
    return res.rows as Record<string, unknown>[];
  }
}
