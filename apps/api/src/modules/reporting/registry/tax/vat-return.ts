import { register } from '../index.js';
register({ id:'tax.vat-return', version:1, title:{ ar:'الإقرار الضريبي', en:'VAT Return' }, category:'tax', requiredPermission:'reports.tax.vat-return.read', dataSources:[{ module:'tax', service:'vatReturnQueries.byTreatment()', tables:['journal_lines'], purpose:{ ar:'ضريبة', en:'VAT' } }] });
