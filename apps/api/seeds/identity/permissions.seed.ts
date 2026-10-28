import { getPool } from '../../src/infra/db/db.js';

// Extracted from AUTHORIZATION_MATRIX.md §3 (identity-relevant + core modules) — stable catalog
// This list must stay in sync with AUTHORIZATION_MATRIX; docs-drift script checks.
export const PERMISSIONS: { key: string; module: string; description: string }[] = [
  { key: 'accounting.journal_entries.view', module: 'accounting', description: 'View journal entries and GL' },
  { key: 'accounting.journal_entries.create', module: 'accounting', description: 'Draft manual journals' },
  { key: 'accounting.journal_entries.approve', module: 'accounting', description: 'Approve drafts for posting' },
  { key: 'accounting.journal_entries.post', module: 'accounting', description: 'Post approved entries' },
  { key: 'sales.quotations.view', module: 'sales', description: 'View quotations' },
  { key: 'sales.quotations.create', module: 'sales', description: 'Create quotations' },
  { key: 'sales.quotations.approve', module: 'sales', description: 'Approve quotations' },
  { key: 'sales.invoices.view', module: 'sales', description: 'View sales invoices' },
  { key: 'sales.invoices.create', module: 'sales', description: 'Create invoices' },
  { key: 'sales.invoices.approve', module: 'sales', description: 'Approve invoices' },
  { key: 'sales.invoices.post', module: 'sales', description: 'Post invoices' },
  { key: 'purchasing.purchase_orders.view', module: 'purchasing', description: 'View purchase orders' },
  { key: 'purchasing.purchase_orders.create', module: 'purchasing', description: 'Create purchase orders' },
  { key: 'purchasing.purchase_orders.approve', module: 'purchasing', description: 'Approve purchase orders' },
  { key: 'inventory.movements.view', module: 'inventory', description: 'View inventory movements' },
  { key: 'inventory.movements.create', module: 'inventory', description: 'Create inventory movements' },
  { key: 'treasury.accounts.view', module: 'treasury', description: 'View treasury accounts' },
  { key: 'identity.users.view', module: 'identity', description: 'View users' },
  { key: 'identity.users.manage', module: 'identity', description: 'Manage users' },
  { key: 'identity.users.invite', module: 'identity', description: 'Invite users' },
  { key: 'identity.roles.view', module: 'identity', description: 'View roles' },
  { key: 'identity.roles.manage', module: 'identity', description: 'Manage roles' },
  { key: 'identity.mfa.manage', module: 'identity', description: 'Manage MFA' },
  { key: 'tenancy.settings.view', module: 'tenancy', description: 'View tenant settings' },
  { key: 'tenancy.settings.manage', module: 'tenancy', description: 'Manage tenant settings' },
  { key: 'platform.tenants.view', module: 'platform', description: 'View all tenants (platform)' },
  { key: 'platform.tenants.manage', module: 'platform', description: 'Manage tenants (platform)' },
  { key: 'audit.events.view', module: 'audit', description: 'View audit events' },
];

export async function seedPermissions() {
  const pool = getPool();
  for (const p of PERMISSIONS) {
    await pool.query(`INSERT INTO permissions (key, module, description) VALUES ($1,$2,$3) ON CONFLICT (key) DO NOTHING`, [p.key, p.module, p.description]);
  }
}
