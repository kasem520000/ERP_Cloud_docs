"use client";

/**
 * P4-T12a — tenant-side terminate of an ACTIVE opt-in support session.
 * DELETE /api/bff/tenancy/support-sessions/:id → { terminated: true };
 * 409 tenancy/support-session-not-active maps to the localized message.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import { bffFetch } from "../lib/client-api";
import { localizedTenancyError } from "../lib/messages";

export interface TerminateResult {
  terminated: boolean;
}

export function SupportSessionTerminateButton({
  locale,
  sessionId,
}: {
  locale: Locale;
  sessionId: string;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onTerminate(): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await bffFetch<TerminateResult>(
      `tenancy/support-sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    );
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
        className="btn btn-danger btn-small"
        disabled={busy}
        onClick={() => {
          void onTerminate();
        }}
      >
        {busy ? d.loading : d.supportTerminate}
      </button>
      {error !== null && <p className="small" role="alert">{error}</p>}
    </span>
  );
}
