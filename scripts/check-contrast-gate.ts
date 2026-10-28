import { contrastGate } from '../packages/ui/src/tokens/tokens.js';
const r=contrastGate();
console.log('contrast ratios', r.ratios);
if (!r.pass) { console.error('contrast gate FAILED'); process.exit(1); } else console.log('contrast gate green');
