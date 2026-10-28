// Cache key (tenant, report_id, contract_version, params_hash) with as-of semantics; invalidation on posting/reversal/period-lock; current runs cached ≤60s
const cache=new Map<string,{ envelope:string; at:number; ttl:number }>();
export function cacheKey(tenantId:string, reportKey:string, version:number, paramsHash:string, asOf:string){ return `${tenantId}:${reportKey}:${version}:${paramsHash}:${asOf}`; }
export function getCached(key:string): string|undefined{
  const e=cache.get(key); if(!e) return undefined;
  if(Date.now()-e.at > e.ttl*1000){ cache.delete(key); return undefined; }
  return e.envelope;
}
export function setCached(key:string, envelope:string, ttlSeconds:number){ cache.set(key,{ envelope, at:Date.now(), ttl:ttlSeconds }); }
export function invalidateOnPosting(tenantId:string){ for(const k of cache.keys()) if(k.startsWith(tenantId+':')) cache.delete(k); } // posting/reversal/period-lock invalidation
export const CURRENT_TTL_SECONDS=60;
