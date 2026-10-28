import crypto from 'node:crypto';
// Ten-layer model CONFIGURATION_ENGINE §3 — L1 industry, L2 jurisdiction, L3 plan, L4 entitlements, L5 tenant settings, L7 branch, L8 modules, L10 policy, L6 request overlay, L9 nav derivation
export type LayerKey = 'L1'|'L2'|'L3'|'L4'|'L5'|'L7'|'L8'|'L10';
export const PRECEDENCE: LayerKey[] = ['L1','L2','L3','L4','L5','L7','L8','L10']; // L10 wins
export interface Layer { key: LayerKey; data: Record<string, unknown>; }
export interface EffectiveConfig { resolved: Record<string,unknown>; resolved_hash: string; layers: LayerKey[]; }
const REGISTRY = new Set(['sales.cash_autopost','inventory.allow_negative_stock','inventory.fefo_for_expiry_items','numbering.series','terminology.pos.sales']);
export function resolveEffectiveConfig(layers: Layer[]): EffectiveConfig {
  const sorted=[...layers].sort((a,b)=> PRECEDENCE.indexOf(a.key)-PRECEDENCE.indexOf(b.key));
  const resolved: Record<string,unknown>={};
  for(const l of sorted){ for(const [k,v] of Object.entries(l.data)){
    if(!REGISTRY.has(k) && !k.startsWith('feature.') && !k.startsWith('nav.') && !k.startsWith('report.')) throw Object.assign(new Error(`unknown_key ${k}`),{status:400});
    resolved[k]=v;
  }}
  // type check: inventory.allow_negative_stock must be boolean
  if(resolved['inventory.allow_negative_stock']!==undefined && typeof resolved['inventory.allow_negative_stock']!=='boolean') throw Object.assign(new Error('type_violation inventory.allow_negative_stock'),{status:400});
  const hash=crypto.createHash('sha256').update(JSON.stringify(resolved)).digest('hex').slice(0,16);
  return {resolved, resolved_hash: hash, layers: sorted.map(l=>l.key)};
}
// L6 overlay never cached, L9 nav derivation from resolved
export function deriveNavigation(resolved: Record<string,unknown>, entitled: Set<string>): string[] {
  const nav=resolved['nav.registry'] as string[]|undefined; if(!nav) return [];
  return nav.filter(k=> entitled.has(k.replace('nav.','')));
}
