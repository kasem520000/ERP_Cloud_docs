import { EffectiveConfig } from '../domain/resolution.js';
const cache=new Map<string,{cfg:EffectiveConfig; hash:string}>();
const EVENTS: Record<string, 'tenant'|'request'|'full'> = {
  'tenant.updated':'tenant','template.applied':'tenant','template.switched':'tenant','pack.upgraded':'tenant','plan.changed':'tenant','entitlements.changed':'tenant','settings.changed':'tenant','branch.updated':'tenant','module.installed':'tenant','module.deactivated':'tenant','policy.changed':'full','permissions.changed':'request'
};
export function getCached(tenantId:string, hash:string): EffectiveConfig|null {
  const hit=cache.get(tenantId); return hit && hit.hash===hash ? hit.cfg : null;
}
export function setCached(tenantId:string, hash:string, cfg:EffectiveConfig){ cache.set(tenantId,{hash, cfg}); }
export function invalidate(event:string, tenantId:string){
  const scope=EVENTS[event] ?? 'full';
  if(scope==='tenant' || scope==='full') cache.delete(tenantId);
  // L6 request overlay never cached — no op
}
export function _clearAll(){ cache.clear(); }
