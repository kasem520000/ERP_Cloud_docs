import fs from 'node:fs';
import path from 'node:path';
const dir='apps/web/src/i18n';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.ar.json'));
let ok=true;
for (const ar of files) { const en=ar.replace('.ar.json','.en.json'); const a=JSON.parse(fs.readFileSync(path.join(dir,ar),'utf8')); const b=JSON.parse(fs.readFileSync(path.join(dir,en),'utf8')); const ak=Object.keys(a).sort().join(','); const bk=Object.keys(b).sort().join(','); if (ak!==bk) { console.error(`parity fail ${ar}: ${ak} vs ${bk}`); ok=false; } }
if (!ok) process.exit(1); else console.log('i18n parity green');
