/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies break module boundaries (DEPENDENCY_RULES.md §2)',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-app-api-to-web',
      severity: 'error',
      comment: 'API must never import web (ADR-0002 layering)',
      from: { path: '^apps/api/' },
      to: { path: '^apps/web/' },
    },
    {
      name: 'no-web-to-api',
      severity: 'error',
      comment: 'Web must never import API internals (DEPENDENCY_RULES.md §3)',
      from: { path: '^apps/web/' },
      to: { path: '^apps/api/' },
    },
    {
      name: 'no-domain-core-cycle',
      severity: 'error',
      comment: 'domain-core is the shared kernel — nothing inside it may import apps',
      from: { path: '^packages/domain-core/' },
      to: { path: '^apps/' },
    },
    {
      name: 'no-contracts-to-apps',
      severity: 'error',
      comment: 'contracts must not import app code (single source of truth)',
      from: { path: '^packages/contracts/' },
      to: { path: '^apps/' },
    },
    {
      name: 'no-ui-direct-db',
      severity: 'error',
      comment: 'UI package must not import database or server infra',
      from: { path: '^packages/ui/' },
      to: { path: '^apps/api/src/infra' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: 'boundary-fixture' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
    reporterOptions: { archi: { collapsePattern: '^(apps|packages)/[^/]+' } },
  },
};
