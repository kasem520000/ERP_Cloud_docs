import { z } from 'zod';
export const ManifestSchema = z.object({
  key: z.string().regex(/^industry\.[a-z_]+$/),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/),
  required_feature_keys: z.array(z.string()).min(1),
  optional_feature_keys: z.array(z.string()).optional(),
  phase_gated: z.array(z.string()).optional(),
  navigation_manifest: z.array(z.object({ group: z.string(), items: z.array(z.string()) })),
  terminology_overrides: z.record(z.record(z.string())).optional(),
  numbering_series: z.array(z.string()),
  report_pins: z.array(z.string()),
  inventory_defaults: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
});
export type Manifest = z.infer<typeof ManifestSchema>;
