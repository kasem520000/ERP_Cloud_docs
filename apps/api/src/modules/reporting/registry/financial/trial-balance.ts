import { register } from '../index.js';
register({
  id:'financial.trial-balance', version:1, title:{ ar:'ميزان المراجعة', en:'Trial Balance' }, category:'financial',
  requiredPermission:'reports.financial.tb.read',
  dataSources:[{ module:'accounting', service:'glQueries.periodMovement()', tables:['journal_entries','journal_lines','accounts'], purpose:{ ar:'حركة الفترة', en:'period movement' } }]
});
