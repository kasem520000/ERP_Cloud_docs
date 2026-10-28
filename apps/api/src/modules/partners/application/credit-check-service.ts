import Decimal from 'decimal.js';
import { getPool } from '../../../infra/db/db.js';

Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

export type CreditAction = 'ALLOW' | 'WARN' | 'BLOCK';
export type CreditCheckResult = {
  partnerId: string;
  openBalance: string; // 4dp string
  creditLimit: string;
  overdueAmount: string;
  action: CreditAction;
  limitActionPolicy: string;
};

/**
 * BR-001 interface: computes exposure over opening-balance drafts (006) + future journal subledger (007+).
 * Reads tenant policy sales.credit_limit_action = warn default.
 * Enforcement point is sales approval in PHASE-012 — this returns action only.
 */
export async function checkCredit(tenantId: string, partnerId: string, amountDelta: string): Promise<CreditCheckResult> {
  if (!/^-?\d{1,15}(\.\d{1,4})?$/.test(amountDelta)) throw Object.assign(new Error('invalid_amount'), { status: 400 });
  const pool = getPool();
  const partner = await pool.query(`SELECT credit_limit FROM partners WHERE id=$1 AND tenant_id=$2`, [partnerId, tenantId]);
  if (partner.rows.length === 0) throw Object.assign(new Error('partner_not_found'), { status: 404 });
  const creditLimit = new Decimal(partner.rows[0].credit_limit ?? '0');

  // openBalance from partner_balances read model (draft-aware in 006)
  const bal = await pool.query(`SELECT open_balance, overdue_amount FROM partner_balances WHERE tenant_id=$1 AND partner_id=$2`, [tenantId, partnerId]);
  const openBalance = new Decimal(bal.rows[0]?.open_balance ?? '0');
  const overdueAmount = new Decimal(bal.rows[0]?.overdue_amount ?? '0');

  // also sum opening_balance_docs DRAFT for partner if read model not yet populated
  if (bal.rows.length === 0) {
    const draftSum = await pool.query(`SELECT COALESCE(SUM(amount::numeric),0) as sum FROM opening_balance_docs WHERE tenant_id=$1 AND partner_id=$2 AND status='DRAFT'`, [tenantId, partnerId]);
    openBalance.plus(new Decimal(draftSum.rows[0]?.sum ?? '0'));
  }

  const delta = new Decimal(amountDelta);
  const projected = openBalance.plus(delta);

  // policy
  const pol = await pool.query(`SELECT value FROM tenant_settings WHERE tenant_id=$1 AND key='sales.credit_limit_action'`, [tenantId]);
  const policy: string = (pol.rows[0]?.value ? JSON.parse((pol.rows[0].value as string) ?? '"warn"') : 'warn') as string;
  const policyNorm = policy.toLowerCase();

  let action: CreditAction = 'ALLOW';
  if (creditLimit.gt(0) && projected.gt(creditLimit)) {
    if (policyNorm === 'block') action = 'BLOCK';
    else action = 'WARN';
  }
  if (overdueAmount.gt(0)) action = action === 'ALLOW' ? 'WARN' : action;

  return {
    partnerId,
    openBalance: openBalance.toFixed(4),
    creditLimit: creditLimit.toFixed(4),
    overdueAmount: overdueAmount.toFixed(4),
    action,
    limitActionPolicy: policyNorm,
  };
}
