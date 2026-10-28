import { getPool } from '../../src/infra/db/db.js';
import { PERMISSIONS } from './permissions.seed.js';

export const SYSTEM_ROLES: { key: string; name: string; nameAr: string }[] = [
  { key: 'owner', name: 'Owner', nameAr: 'المالك' },
  { key: 'accountant', name: 'Accountant', nameAr: 'المحاسب' },
  { key: 'sales', name: 'Sales', nameAr: 'المبيعات' },
  { key: 'purchasing', name: 'Purchasing', nameAr: 'المشتريات' },
  { key: 'warehouse', name: 'Warehouse', nameAr: 'المستودع' },
  { key: 'cashier', name: 'Cashier', nameAr: 'أمين الصندوق' },
  { key: 'viewer', name: 'Viewer', nameAr: 'المشاهد' },
  { key: 'platform_admin', name: 'Platform Admin', nameAr: 'مدير المنصة' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: PERMISSIONS.map(p => p.key),
  accountant: PERMISSIONS.filter(p => ['accounting','treasury','tax','audit'].includes(p.module)).map(p => p.key),
  sales: PERMISSIONS.filter(p => p.module === 'sales').map(p => p.key),
  purchasing: PERMISSIONS.filter(p => p.module === 'purchasing').map(p => p.key),
  warehouse: ['inventory.movements.view','inventory.movements.create'],
  cashier: ['sales.invoices.create','treasury.accounts.view'],
  viewer: PERMISSIONS.filter(p => p.key.endsWith('.view')).map(p => p.key),
  platform_admin: ['platform.tenants.view','platform.tenants.manage','audit.events.view'],
};

export async function seedSystemRoles() {
  const pool = getPool();
  for (const r of SYSTEM_ROLES) {
    const id = `00000000-0000-0000-0000-0000000000${SYSTEM_ROLES.indexOf(r).toString().padStart(2,'0')}`;
    await pool.query(`INSERT INTO roles (id, tenant_id, key, name, name_ar, is_system) VALUES ($1,NULL,$2,$3,$4,true) ON CONFLICT (key) WHERE tenant_id IS NULL DO NOTHING`, [id, r.key, r.name, r.nameAr]);
    const roleRow = await pool.query(`SELECT id FROM roles WHERE key=$1 AND tenant_id IS NULL`, [r.key]);
    const roleId = roleRow.rows[0]?.id ?? id;
    for (const perm of ROLE_PERMISSIONS[r.key] ?? []) {
      await pool.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [roleId, perm]);
    }
  }
}
