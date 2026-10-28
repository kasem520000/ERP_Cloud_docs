import { register } from '../index.js';
// retained earnings composition prior-year RE + closed current-year result − live YTD net income counted exactly once bs-current-year-once
register({ id:'financial.balance-sheet', version:1, title:{ ar:'الميزانية العمومية', en:'Balance Sheet' }, category:'financial', requiredPermission:'reports.financial.bs.read', dataSources:[{ module:'accounting', service:'statementQueries.balanceSheet()', tables:['journal_lines'], purpose:{ ar:'المركز المالي', en:'BS' } }] });
