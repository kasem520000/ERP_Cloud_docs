import { describe, it, expect } from 'vitest'; import fs from 'node:fs';
describe('PHASE-020 Offline Sync',()=>{
  it('devices + cursors RLS',()=>{ const s=fs.readFileSync('migrations/0021_offline_sync.sql','utf8'); expect(s).toContain('offline_devices'); expect(s).toContain('sync_cursors'); expect(s).toContain('tenant_isolation'); });
});
describe('PHASE-023 Integrations E-Invoicing',()=>{
  it('integrations + einvoicing_documents RLS',()=>{ const s=fs.readFileSync('migrations/0022_integrations_einvoicing.sql','utf8'); expect(s).toContain('integrations'); expect(s).toContain('einvoicing_documents'); expect(s).toContain('ACCEPTED'); });
});
describe('PHASE-024/025 Security Performance',()=>{
  it('audits + benchmarks RLS',()=>{ const s=fs.readFileSync('migrations/0023_security_performance.sql','utf8'); expect(s).toContain('security_audits'); expect(s).toContain('performance_benchmarks'); });
});
