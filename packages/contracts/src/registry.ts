/**
 * Zod registry v0 — empty but typed registry for future schemas.
 * The registry pattern: schemas register here for OpenAPI generation.
 * PHASE-001 seeds the registry shell; PHASE-002+ populate it.
 */
import { z } from 'zod';

export type RegistryEntry = {
  name: string;
  schema: z.ZodTypeAny;
  version: 1;
};

class ContractRegistry {
  private entries = new Map<string, RegistryEntry>();

  register(entry: RegistryEntry): void {
    if (this.entries.has(entry.name)) throw new Error(`Contract already registered: ${entry.name}`);
    this.entries.set(entry.name, entry);
  }

  get(name: string): RegistryEntry | undefined {
    return this.entries.get(name);
  }

  list(): RegistryEntry[] {
    return [...this.entries.values()];
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }

  count(): number {
    return this.entries.size;
  }
}

export const registry = new ContractRegistry();

/** Health response — first contract registered to prove the pipeline works. */
export const HealthLiveResponseSchema = z.object({
  status: z.literal('ok'),
  build: z.object({
    version: z.string(),
    commit: z.string().optional(),
    timestamp: z.string().optional(),
  }),
});

export type HealthLiveResponse = z.infer<typeof HealthLiveResponseSchema>;

// Register it
registry.register({ name: 'HealthLiveResponse', schema: HealthLiveResponseSchema, version: 1 });
