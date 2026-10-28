import { getPool } from '../../../infra/db/db.js';

export type SearchResult = { id: string; name: string; nameAr?: string | null; score: number; kind: string };

/**
 * Trigram search over partners/items. ≤200ms at 10k rows via gin_trgm_ops indexes.
 * Exact barcode/SKU match has priority (score boost).
 */
export async function searchPartners(tenantId: string, q: string, limit = 20): Promise<SearchResult[]> {
  if (!q || q.trim().length < 2) return [];
  const pool = getPool();
  // Exact code first
  const exact = await pool.query(`SELECT id, name, name_ar, 100 as score FROM partners WHERE tenant_id=$1 AND code ILIKE $2 LIMIT 5`, [tenantId, q]).catch(()=>({ rows: [] }));
  const trgm = await pool.query(`
    SELECT id, name, name_ar, similarity(name, $2) as score
    FROM partners WHERE tenant_id=$1 AND (name % $2 OR name_ar % $2 OR code % $2)
    ORDER BY score DESC LIMIT $3
  `, [tenantId, q, limit]).catch(() => ({ rows: [] as unknown[] }));
  const seen = new Set((exact.rows as { id: string }[]).map(r=>r.id));
  const merged = [...(exact.rows as SearchResult[]), ...(trgm.rows as SearchResult[]).filter(r=>!seen.has((r as unknown as { id: string }).id))];
  return merged.slice(0, limit).map(r => ({ ...r, kind: 'partner' }));
}

export async function searchItems(tenantId: string, q: string, limit = 20): Promise<SearchResult[]> {
  if (!q || q.trim().length < 2) return [];
  const pool = getPool();
  // barcode exact priority
  const bc = await pool.query(`SELECT item_id as id FROM barcodes WHERE tenant_id=$1 AND code=$2 LIMIT 1`, [tenantId, q]).catch(()=>({ rows: [] }));
  const skuExact = await pool.query(`SELECT id, name, name_ar, 100 as score FROM items WHERE tenant_id=$1 AND sku ILIKE $2 LIMIT 5`, [tenantId, q]).catch(()=>({ rows: [] }));
  const trgm = await pool.query(`
    SELECT id, name, name_ar, similarity(name, $2) as score
    FROM items WHERE tenant_id=$1 AND (name % $2 OR name_ar % $2 OR sku % $2)
    ORDER BY score DESC LIMIT $3
  `, [tenantId, q, limit]).catch(()=>({ rows: [] as unknown[] }));
  const fromBc = bc.rows[0] ? await pool.query(`SELECT id, name, name_ar FROM items WHERE id=$1 AND tenant_id=$2`, [(bc.rows[0] as { id: string }).id, tenantId]).catch(()=>({ rows: [] })) : { rows: [] };
  const mergedIds = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of [...(fromBc.rows as SearchResult[]), ...(skuExact.rows as SearchResult[]), ...(trgm.rows as SearchResult[])]) {
    if (!mergedIds.has((r as unknown as { id: string }).id)) { mergedIds.add((r as unknown as { id: string }).id); out.push({ ...(r as unknown as SearchResult), kind: 'item' }); }
  }
  return out.slice(0, limit);
}
