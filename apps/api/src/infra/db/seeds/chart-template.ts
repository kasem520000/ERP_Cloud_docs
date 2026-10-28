export const COA_TEMPLATE: { code: string; name: string; nameAr: string; type: string; purpose?: string }[] = [
  { code: '1000', name: 'Assets', nameAr: 'الأصول', type: 'ASSET' },
  { code: '1100', name: 'Current assets', nameAr: 'الأصول المتداولة', type: 'ASSET' },
  { code: '1110', name: 'Cash on hand', nameAr: 'النقدية بالصندوق', type: 'ASSET' },
  { code: '1111', name: 'Cash — main', nameAr: 'الصندوق الرئيسي', type: 'ASSET', purpose: 'CASH' },
  { code: '1130', name: 'Accounts receivable', nameAr: 'العملاء (المدينون)', type: 'ASSET', purpose: 'AR_CONTROL' },
  { code: '1140', name: 'Inventory', nameAr: 'المخزون', type: 'ASSET', purpose: 'INVENTORY' },
  { code: '2110', name: 'Accounts payable', nameAr: 'الموردون (الدائنون)', type: 'LIABILITY', purpose: 'AP_CONTROL' },
  { code: '2120', name: 'VAT payable', nameAr: 'ض.ق.م المستحقة', type: 'LIABILITY', purpose: 'VAT_PAYABLE' },
  { code: '3200', name: 'Retained earnings', nameAr: 'الأرباح المحتجزة', type: 'EQUITY', purpose: 'RETAINED_EARNINGS' },
  { code: '4100', name: 'Sales revenue', nameAr: 'إيرادات المبيعات', type: 'REVENUE', purpose: 'SALES_REVENUE' },
  { code: '5100', name: 'COGS', nameAr: 'تكلفة المبيعات', type: 'EXPENSE', purpose: 'COGS' },
  { code: '5900', name: 'FX loss', nameAr: 'خسائر فروق العملات', type: 'EXPENSE', purpose: 'FX_LOSS' },
];
