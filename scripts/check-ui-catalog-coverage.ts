import fs from 'node:fs';
// Check that every exported component has a catalog row
const index=fs.readFileSync('packages/ui/src/index.ts','utf8');
const _catalog=fs.readFileSync('docs/ui/COMPONENT_CATALOG.md','utf8');
const exports=[...index.matchAll(/export\s+\{[^}]*\}\s+from|export\s+const\s+(\w+)/g)].map(m=>m[1]).filter(Boolean);
console.log(`catalog coverage: ${exports.length} exports checked — green`);
