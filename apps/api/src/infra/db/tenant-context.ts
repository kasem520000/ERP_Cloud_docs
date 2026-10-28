import { AsyncLocalStorage } from 'node:async_hooks';

export type TenantContext = {
  tenantId: string;
  correlationId?: string;
  actorId?: string;
};

/**
 * AsyncLocalStorage-based tenant context (ADR-0005).
 * Every repository MUST run inside this context; missing context throws.
 * GUC is set via SET LOCAL inside the unit-of-work transaction.
 */
export const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext {
  const ctx = tenantContextStorage.getStore();
  if (!ctx) throw new MissingTenantContextError('No tenant context — call withTenant() or runWithTenant() first');
  return ctx;
}

export function getTenantId(): string {
  return getTenantContext().tenantId;
}

export function runWithTenant<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return tenantContextStorage.run(ctx, fn);
}

export class MissingTenantContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingTenantContextError';
  }
}
