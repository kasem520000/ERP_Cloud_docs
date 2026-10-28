import { register } from '../index.js';
// contra-account aggregation into parent presentation lines (FINANCIAL_REPORT_RULES §3) + COGS section
register({ id:'financial.income-statement', version:1, title:{ ar:'قائمة الدخل', en:'Income Statement' }, category:'financial', requiredPermission:'reports.financial.is.read', dataSources:[{ module:'accounting', service:'statementQueries.incomeStatement()', tables:['journal_lines','accounts'], purpose:{ ar:'الدخل', en:'income' } }] });
