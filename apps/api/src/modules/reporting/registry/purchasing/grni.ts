import { register } from '../index.js';
register({ id:'purchasing.grni', version:1, title:{ ar:'البضاعة المستلمة غير المفوترة', en:'GRNI' }, category:'purchasing', requiredPermission:'reports.purchasing.grni.read', dataSources:[{ module:'purchasing', service:'apQueries.grniRegister()', tables:['goods_receipts'], purpose:{ ar:'GRNI', en:'GRNI' } }] });
