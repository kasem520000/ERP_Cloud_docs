import { describe, it, expect } from 'vitest';
import { sanitizeMoneyInput, formatMoney } from '../../utils/money';
import { bidiIsolate } from '../../utils/bidi';
describe('MoneyInput',()=>{
  it('accepts only canonical decimal strings',()=>{ expect(sanitizeMoneyInput('12.34')).toBe('12.34'); expect(sanitizeMoneyInput('12,34 SAR')).toBe('1234'); });
  it('sanitizes paste',()=>{ expect(sanitizeMoneyInput('1,234.56abc')).toBe('1234.56'); });
  it('digits LTR-isolated inside RTL',()=>{ expect(bidiIsolate('123')).toContain('\u2068'); });
  it('formats via Intl',()=>{ expect(formatMoney('1234.50','SAR','en')).toContain('1,234'); });
});
