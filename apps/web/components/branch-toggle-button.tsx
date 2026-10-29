"use client";

/**
 * P4-T12a — branch activate/deactivate toggle.
 * PATCH /api/bff/tenancy/branches/:id { isActive: !current }.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { BranchRow } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedTenancyError } from "../lib/messages";

export function BranchToggleButton({
  locale,
  branchId,
  isActive,
}: {
  locale: Locale;
  branchId: string;
  isActive: boolean;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle(): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await bffFetch<BranchRow>(`tenancy/branches/${encodeURIComponent(branchId)}`, {
      method: "PATCH",
      body: { isActive: !isActive },
    });
    setBusy(false);
    if (!result.ok) {
      setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    router.refresh();
  }

  return (
    <span>
      <button
        type="button"
        className={`btn btn-small ${isActive ? "btn-danger" : "btn-secondary"}`}
        disabled={busy}
        onClick={() => {
          void onToggle();
        }}
      >
        {busy ? d.loading : isActive ? d.branchesDeactivate : d.branchesActivate}
      </button>
      {error !== null && <p className="small" role="alert">{error}</p>}
    </span>
  );
}
