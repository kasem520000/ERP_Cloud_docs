// PLACEHOLDER prices per OQ-002 — values changed without architecture change
import { getPool } from '../src/infra/db/db.js';

export const PLANS = [
  { key: 'starter', name: 'Starter / البداية', price_amount: '99.0000', currency_code: 'SAR', billing_period: 'MONTHLY', limits: JSON.stringify({ users: 3, branches: 1, documents_per_month: 500 }), feature_keys: ['platform.registration','platform.onboarding','platform.branches','platform.users_roles','platform.audit_trail','accounting.chart_of_accounts','accounting.journal_entries'] },
  { key: 'business', name: 'Business / الأعمال', price_amount: '299.0000', currency_code: 'SAR', billing_period: 'MONTHLY', limits: JSON.stringify({ users: 10, branches: 3, documents_per_month: 5000 }), feature_keys: ['platform.registration','platform.onboarding','platform.branches','platform.users_roles','platform.audit_trail','platform.notifications','accounting.chart_of_accounts','accounting.journal_entries','inventory.stock_ledger','sales.invoices','purchasing.purchase_orders'] },
  { key: 'enterprise', name: 'Enterprise / المؤسسات', price_amount: '999.0000', currency_code: 'SAR', billing_period: 'MONTHLY', limits: JSON.stringify({ users: 50, branches: 999, documents_per_month: 250000 }), feature_keys: ['platform.registration','platform.onboarding','platform.branches','platform.users_roles','platform.audit_trail','platform.notifications','accounting.chart_of_accounts','accounting.journal_entries','inventory.stock_ledger','sales.invoices','purchasing.purchase_orders','manufacturing.boms','distribution.settlements','crm.leads'] },
];

export async function seedPlans(): Promise<void> {
  const pool = getPool();
  for (const p of PLANS) {
    const id = `00000000-0000-0000-0000-0000000000${String(PLANS.indexOf(p)+1).padStart(2,'0')}`;
    await pool.query(`INSERT INTO plans (id, key, name, price_amount, currency_code, billing_period, limits, feature_keys) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (key) DO UPDATE SET name=EXCLUDED.name, feature_keys=EXCLUDED.feature_keys`, [id, p.key, p.name, p.price_amount, p.currency_code, p.billing_period, p.limits, p.feature_keys]);
  }
}
