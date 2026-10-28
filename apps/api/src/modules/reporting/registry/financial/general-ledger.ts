import { register } from '../index.js';
register({ id:'financial.general-ledger', version:1, title:{ ar:'دفتر الأستاذ', en:'General Ledger' }, category:'financial', requiredPermission:'reports.financial.gl.read', dataSources:[{ module:'accounting', service:'glQueries.accountLedger()', tables:['journal_lines'], purpose:{ ar:'الأستاذ', en:'ledger' } }] });
