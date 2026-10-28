import { sql } from 'drizzle-orm';
import { getPool } from './db.js';
import { runWithTenant } from './tenant-context.js';
import type { TenantContext } from './tenant-context.js';

export async function withTenant<T>(ctx: TenantContext, fn: (tx: unknown) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['erp.tenant_id', ctx.tenantId]);
    if (ctx.correlationId) {
      await client.query('SELECT set_config($1, $2, true)', ['erp.correlation_id', ctx.correlationId]);
    }
    const result = await runWithTenant(ctx, async () => fn(client));
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function setTenantGuc(tx: { execute: (q: unknown) => Promise<unknown> }, tenantId: string): Promise<void> {
  await tx.execute(sql`SELECT set_config('erp.tenant_id', ${tenantId}, true)`);
}
