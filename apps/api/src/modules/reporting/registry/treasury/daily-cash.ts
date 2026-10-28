import { register } from '../index.js';
register({ id:'treasury.daily-cash', version:1, title:{ ar:'النقدية اليومية', en:'Daily Cash' }, category:'treasury', requiredPermission:'reports.treasury.daily-cash.read', dataSources:[{ module:'treasury', service:'treasuryQueries.dailyCash()', tables:['cash_movements'], purpose:{ ar:'نقدية', en:'cash' } }] });
