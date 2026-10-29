import { z } from "zod";

import { DomainError } from "@erp/domain-core";

/**
 * Tenant-settings typed key registry (PHASE-004 T8;
 * CONFIGURATION_ENGINE.md §4 "keys are dot-namespaced `<module>.<name>`
 * with a versioned JSON schema per module; writes are validated
 * server-side. Unknown or unvalidated keys are rejected").
 *
 * PHASE-004 registers the phase-scoped keys (phase §4): locale +
 * numeral system, the onboarding-written keys (fiscal preference,
 * numbering defaults, jurisdiction binding), the provisional
 * `tax.registration.*` pair (migrated by PHASE-009 per
 * expand-migrate-contract), and the support-access opt-in toggle
 * (matrix §7 rule 1). Domain-module keys (sales.*, inventory.*,
 * treasury.*) land with their owning phases — adding a key = phase
 * scope + schema version bump (§4 governance).
 *
 * Reconciliation note (documented in the completion report): the
 * `general.numeral_system` default is `latn` — LOCALIZATION_ARCHITECTURE
 * §7, RTL_AND_LTR §5, CURRENCY_AND_PRECISION §8 and the SA pack example
 * all say `latn` (Western) is the default with `arab` as the display
 * option; the CONFIGURATION_ENGINE table's `arab` default is the
 * minority reading and is corrected in this phase's docs sync.
 */

export interface SettingDefinition {
  readonly key: string;
  readonly schema: z.ZodType<unknown>;
  /** Default written at provisioning when absent. */
  readonly default: unknown;
  readonly description: string;
}

export const SETTINGS_REGISTRY: Readonly<Record<string, SettingDefinition>> = Object.freeze({
  "general.default_locale": Object.freeze({
    key: "general.default_locale",
    schema: z.enum(["ar", "en"]),
    default: "ar",
    description: "Tenant default UI locale (NFR-001; ar = Arabic-first).",
  }),
  "general.numeral_system": Object.freeze({
    key: "general.numeral_system",
    schema: z.enum(["latn", "arab"]),
    default: "latn",
    description: "Display numeral system; ledger amounts stay latn always.",
  }),
  "general.hijri_display": Object.freeze({
    key: "general.hijri_display",
    schema: z.boolean(),
    default: true,
    description: "Display-only Hijri overlay; fiscal years stay Gregorian (A-004).",
  }),
  "fiscal_calendar.start_month": Object.freeze({
    key: "fiscal_calendar.start_month",
    schema: z.number().int().min(1).max(12),
    default: 1,
    description: "Fiscal year start month preference (years/periods created in PHASE-007).",
  }),
  "numbering.defaults": Object.freeze({
    key: "numbering.defaults",
    schema: z.object({
      assign_at: z.enum(["approval", "posting"]).default("posting"),
    }),
    default: { assign_at: "posting" },
    description:
      "BR-029 document-numbering policy default (per-type rows + the numbering service land in PHASE-007).",
  }),
  "platform.support.opt_in": Object.freeze({
    key: "platform.support.opt_in",
    schema: z.boolean(),
    default: false,
    description: "Tenant toggle enabling platform support sessions (matrix §7 rule 1).",
  }),
  "tax.registration.status": Object.freeze({
    key: "tax.registration.status",
    schema: z.enum(["REGISTERED", "NOT_REGISTERED", "DEREGISTERED"]),
    default: "NOT_REGISTERED",
    description:
      "Provisional tax-registration status (TAX_ENGINE §1); the tax_registrations table (PHASE-009) migrates this key.",
  }),
  "tax.registration.number": Object.freeze({
    key: "tax.registration.number",
    schema: z.string().min(3).max(50),
    default: null,
    description:
      "Provisional tax-registration number (required while status = REGISTERED); migrated by PHASE-009.",
  }),
  "tax.jurisdiction.binding": Object.freeze({
    key: "tax.jurisdiction.binding",
    schema: z.object({
      country_code: z.string().length(2),
      pack_key: z.string().min(2).max(60),
      bound_at: z.string(),
    }),
    default: null,
    description:
      "Provisional primary-jurisdiction pack binding (ADR-0010 concept); the versioned jurisdictions registry (PHASE-009) formalizes it.",
  }),
});

export const SETTING_KEYS: readonly string[] = Object.keys(SETTINGS_REGISTRY);

/** Unknown or unvalidated setting key/value (fail loud, §4). */
export class UnknownSettingKeyError extends DomainError {
  constructor(key: string) {
    super(
      "tenancy/unknown-setting-key",
      `Unknown tenant setting key: ${key} (CONFIGURATION_ENGINE §4 — keys are schema-registered)`,
    );
  }
}

export class InvalidSettingValueError extends DomainError {
  constructor(key: string, message: string) {
    super(
      "tenancy/invalid-setting-value",
      `Invalid value for tenant setting ${key}: ${message}`,
    );
  }
}

/** Validate a settings write; throws the typed §4 errors on failure. */
export function parseSettingValue(key: string, value: unknown): unknown {
  const definition = SETTINGS_REGISTRY[key];
  if (definition === undefined) {
    throw new UnknownSettingKeyError(key);
  }
  const parsed = definition.schema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new InvalidSettingValueError(
      key,
      issue === undefined ? "schema validation failed" : `${issue.message} at ${issue.path.join(".")}`,
    );
  }
  return parsed.data;
}

/**
 * Registration-time cross-key rule (TAX_ENGINE §1): a REGISTERED tenant
 * must carry a registration number; NOT_REGISTERED/DEREGISTERED must not.
 */
export function validateTaxRegistrationPair(
  status: string,
  number: string | null,
): void {
  if (status === "REGISTERED" && (number === null || number.length === 0)) {
    throw new InvalidSettingValueError(
      "tax.registration.number",
      "a registration number is required while tax.registration.status = REGISTERED",
    );
  }
  if (status !== "REGISTERED" && number !== null && number.length > 0) {
    throw new InvalidSettingValueError(
      "tax.registration.number",
      "a registration number is only valid while tax.registration.status = REGISTERED",
    );
  }
}
