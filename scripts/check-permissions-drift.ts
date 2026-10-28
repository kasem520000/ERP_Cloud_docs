// eslint-disable-next-line no-useless-escape
import fs from 'node:fs';
import { PERMISSIONS } from '../apps/api/seeds/identity/permissions.seed.js';

const matrix = fs.readFileSync('docs/security/AUTHORIZATION_MATRIX.md', 'utf8');
// crude check: every permission key in seed must appear in matrix
const missingInMatrix = PERMISSIONS.filter(p => !matrix.includes(p.key));
const matrixKeys = [...matrix.matchAll(/`([a-z_]+\\.[a-z_\\.]+\.[a-z_]+)`/g)].map(m => m[1]);
const uniqueMatrixKeys = [...new Set(matrixKeys)];
const _missingInSeed = uniqueMatrixKeys.filter(k => !PERMISSIONS.some(p => p.key === k) && !k.includes('view') );
if (missingInMatrix.length) { console.error('Permissions in seed missing from matrix:', missingInMatrix.map(p=>p.key)); process.exit(1); }
console.log(`Permissions drift OK: ${PERMISSIONS.length} permissions synced (matrix has ${uniqueMatrixKeys.length} keys)`);
