import { register } from '../index.js';
// indirect method from IS + balance deltas with documented limitation displayed on report; cf-cash-tie ↔ INV-019
register({ id:'financial.cash-flow', version:1, title:{ ar:'التدفق النقدي', en:'Cash Flow' }, category:'financial', requiredPermission:'reports.financial.cf.read', dataSources:[{ module:'accounting', service:'statementQueries.cashFlowIndirect()', tables:['journal_lines'], purpose:{ ar:'تدفق', en:'cash flow' } }] });
