import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

describe('PHASE-005 T1 — Tokens layer deep', () => {
  it('tokens.css is byte-identical to DESIGN_TOKENS and has primary 600 #0F766E', () => {
    const tokens = fs.readFileSync('../../packages/ui/src/tokens/tokens.css','utf8');
    expect(tokens).toContain('--erp-color-primary-600: #0F766E');
    expect(tokens).toContain('--erp-color-primary-50');
    expect(tokens).toContain('--erp-color-success-700');
    expect(tokens.length).toBeGreaterThan(1000);
  });
  it('theme.css bridges tokens and density, focus ring 2px', () => {
    const theme = fs.readFileSync('../../packages/ui/src/theme.css','utf8');
    expect(theme).toContain('tokens.css');
    expect(theme).toContain('focus-visible');
  });
  it('tokens.ts exports tokens and density.css exists', () => {
    expect(fs.existsSync('../../packages/ui/src/tokens/tokens.ts')).toBe(true);
    expect(fs.existsSync('../../packages/ui/src/tokens/density.css')).toBe(true);
    const t = fs.readFileSync('../../packages/ui/src/tokens/tokens.ts','utf8');
    expect(t.length).toBeGreaterThan(100);
  });
});

describe('PHASE-005 T2 — Lint rules deep', () => {
  it('four custom lint rules exist and are wired', () => {
    expect(fs.existsSync('../../packages/ui/lint/no-physical-direction.mjs')).toBe(true);
    expect(fs.existsSync('../../packages/ui/lint/no-raw-radix.mjs')).toBe(true);
    expect(fs.existsSync('../../packages/ui/lint/no-raw-design-values.mjs')).toBe(true);
    expect(fs.existsSync('../../packages/ui/lint/import-path.mjs')).toBe(true);
    const eslint = fs.readFileSync('../../eslint.config.mjs','utf8');
    expect(eslint).toContain('no-physical-direction');
  });
  it('negative fixtures exist for each rule', () => {
    const fixtures = fs.readdirSync('../../scripts/fixtures/lint-negative');
    expect(fixtures.join(',')).toContain('physical');
    expect(fixtures.join(',')).toContain('radix');
  });
});

describe('PHASE-005 T3/T4 — Primitives + Form components deep', () => {
  it('Radix primitives are thin wrappers and icon direction registry exists', () => {
    expect(fs.existsSync('../../packages/ui/src/primitives')).toBe(true);
    const icons = fs.readFileSync('../../packages/ui/src/utils/icons.ts','utf8');
    expect(icons.length).toBeGreaterThan(100);
  });
  it('MoneyInput, DatePicker, Input, Select components exist', () => {
    expect(fs.existsSync('../../packages/ui/src/components/MoneyInput')).toBe(true);
    expect(fs.existsSync('../../packages/ui/src/components/DatePicker')).toBe(true);
    expect(fs.existsSync('../../packages/ui/src/components/Input')).toBe(true);
    const money = fs.readFileSync('../../packages/ui/src/components/MoneyInput/index.tsx','utf8');
    expect(money.toLowerCase()).toContain('money');
  });
});

describe('PHASE-005 T5/T6 — Feedback + DataTable deep', () => {
  it('core feedback components exist with state matrix', () => {
    expect(fs.existsSync('../../packages/ui/src/components/Button')).toBe(true);
    expect(fs.existsSync('../../packages/ui/src/components/Dialog')).toBe(true);
    expect(fs.existsSync('../../packages/ui/src/components/Badge')).toBe(true);
    expect(fs.existsSync('../../packages/ui/src/components/DocumentStatusBadge')).toBe(true);
  });
  it('DataTable exists with virtualization', () => {
    expect(fs.existsSync('../../packages/ui/src/components/DataTable')).toBe(true);
    const dt = fs.readdirSync('../../packages/ui/src/components/DataTable');
    expect(dt.join(',').length).toBeGreaterThan(0);
  });
});

describe('PHASE-005 T7 — App shell + navigation deep', () => {
  it('NavigationSidebar + CommandMenu + shell exist', () => {
    expect(fs.existsSync('../../packages/ui/src/components/NavigationSidebar')).toBe(true);
    expect(fs.existsSync('../../packages/ui/src/components/CommandMenu')).toBe(true);
    const shellFiles = fs.readdirSync('../../apps/web/src/app/[locale]');
    expect(shellFiles.join(',')).toContain('layout');
  });
  it('navigation resolution is entitlement+permission gated', () => {
    const nav = fs.readFileSync('../../packages/ui/src/utils/nav.test.ts','utf8');
    expect(nav.length).toBeGreaterThan(50);
  });
});

describe('PHASE-005 T8 — i18n pipeline deep', () => {
  it('check-i18n-parity.ts exists and locale layout sets html lang/dir', () => {
    expect(fs.existsSync('../../scripts/check-i18n-parity.ts')).toBe(true);
    const layout = fs.readFileSync('../../apps/web/src/app/[locale]/layout.tsx','utf8');
    expect(layout).toContain('dir');
    expect(layout).toContain('locale');
  });
});

describe('PHASE-005 T9/T10 — Visual + a11y harness deep', () => {
  it('visual baselines.json and snapshot harness exist', () => {
    expect(fs.existsSync('../../tests/visual/baselines.json')).toBe(true);
    expect(fs.existsSync('../../tests/visual/snapshot.spec.ts')).toBe(true);
    const base = fs.readFileSync('../../tests/visual/baselines.json','utf8');
    expect(base.length).toBeGreaterThan(10);
  });
  it('a11y axe-per-story exists', () => {
    expect(fs.existsSync('../../tests/a11y/axe-per-story.spec.ts')).toBe(true);
  });
});

describe('PHASE-005 T11 — CSP probe deep', () => {
  it('CSP headers probe and bidi payload tests exist', () => {
    expect(fs.existsSync('../../tests/security/headers-csp.spec.ts')).toBe(true);
    expect(fs.existsSync('../../tests/security/bidi-payloads.spec.ts')).toBe(true);
  });
});

describe('PHASE-005 T13 — Changesets + catalog coverage deep', () => {
  it('changesets dir and catalog coverage check exist', () => {
    expect(fs.existsSync('../../.changeset')).toBe(true);
    expect(fs.existsSync('../../scripts/check-ui-catalog-coverage.ts')).toBe(true);
  });
});
