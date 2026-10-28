// REPORT_CONTRACT schema validation at boot (REPORT_CONTRACT.md §1) — minimal zod-like stub to avoid extra dep
type ReportContract = {
  id: string; version: number; title: { ar:string; en:string };
  category: 'financial'|'ar-ap'|'sales'|'purchasing'|'inventory'|'treasury'|'tax'|'platform'|'industry';
  requiredPermission: string;
  dataSources: { module:string; service:string; tables:string[]; purpose:{ ar:string; en:string } }[];
};
const registry: ReportContract[] = [];
function validate(contract: ReportContract){
  if(!contract.id || !contract.requiredPermission.startsWith('reports.')) throw new Error('invalid contract');
  if(!contract.dataSources?.length) throw new Error('missing dataSources');
}
export function register(contract: ReportContract){
  validate(contract);
  if(registry.find(r=> r.id===contract.id)) throw new Error(`duplicate id ${contract.id}`);
  registry.push(contract);
}
export function snapshot(){ return registry.map(r=> ({ id:r.id, version:r.version, title:r.title, category:r.category, permission:r.requiredPermission })); }
export function validateAll(){ for(const c of registry) validate(c); } // boot-time validation per REPORTING_ARCHITECTURE §2

// Load contracts
import './financial/trial-balance.js';
import './financial/general-ledger.js';
import './financial/income-statement.js';
import './financial/balance-sheet.js';
import './financial/cash-flow.js';
import './inventory/stock-on-hand.js';
import './sales/by-item.js';
import './purchasing/grni.js';
import './ar-ap/aging.js';
import './tax/vat-return.js';
import './treasury/daily-cash.js';
import './platform/audit-trail.js';
