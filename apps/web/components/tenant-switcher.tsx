"use client";

/**
 * Tenant switcher: PUT /api/bff/session { tenantId } — the BFF rotates the
 * session server-side and reissues the cookies; a full router refresh
 * re-renders every server component under the new tenant context.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import { bffFetch } from "../lib/client-api";
import { localizedApiError } from "../lib/messages";

export interface TenantOption {
  tenantId: string;
  label: string;
  /** ACTIVE membership in an ACTIVE tenant — the only switchable state. */
  switchable: boolean;
  isActive: boolean;
  statusText: string;
}

export function TenantSwitcher({
  locale,
  options,
  activeTenantId,
}: {
  locale: Locale;
  options: TenantOption[];
  activeTenantId: string | null;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function switchTo(tenantId: string): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await bffFetch("session", { method: "PUT", body: { tenantId } });
    setBusy(false);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  if (options.length === 0) {
    return <p className="muted">—</p>;
  }

  return (
    <div>
      <div className="switcher" role="group">
        {options.map((option) => {
          const isActive = option.tenantId === activeTenantId;
          return (
            <button
              key={option.tenantId}
              type="button"
              className="btn btn-secondary"
              aria-current={isActive}
              disabled={busy || isActive || !option.switchable}
              title={option.statusText}
              onClick={() => {
                void switchTo(option.tenantId);
              }}
            >
              {option.label}
              <span className={`badge ${isActive ? "badge-active" : ""}`}>{option.statusText}</span>
            </button>
          );
        })}
      </div>
      {error !== null && <p className="alert alert-error" role="alert">{error}</p>}
    </div>
  );
}
