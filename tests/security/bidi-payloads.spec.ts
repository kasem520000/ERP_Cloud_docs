import { describe, it, expect } from 'vitest';
import { bidiIsolate } from '../../packages/ui/src/utils/bidi.js';
describe('bidi spoof payloads (S-03)',()=>{ it('isolates mixed-script',()=>{ expect(bidiIsolate('test\u202Eevil')).toContain('\u2068'); }); it('money wraps LTR', async()=>{ const { moneyBdiWrap } = await import('../../packages/ui/src/utils/bidi.js'); expect(moneyBdiWrap('1,234.00 SAR')).toContain('dir="ltr"'); }); });
