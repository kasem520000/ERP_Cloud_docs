import { register } from '../index.js';
register({ id:'sales.by-item', version:1, title:{ ar:'المبيعات حسب الصنف', en:'Sales by Item' }, category:'sales', requiredPermission:'reports.sales.by-item.read', dataSources:[{ module:'sales', service:'salesAnalytics.byItem()', tables:['sales_invoices','sales_invoice_lines'], purpose:{ ar:'تحليل', en:'analysis' } }] });
