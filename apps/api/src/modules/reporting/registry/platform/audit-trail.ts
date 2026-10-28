import { register } from '../index.js';
register({ id:'platform.audit-trail', version:1, title:{ ar:'سجل التدقيق', en:'Audit Trail' }, category:'platform', requiredPermission:'reports.platform.audit.read', dataSources:[{ module:'audit', service:'auditQueries.trail()', tables:['audit_events'], purpose:{ ar:'تدقيق', en:'audit' } }] });
