"use client";

/**
 * Revoke a tenant session: POST /api/bff/identity/sessions/{id}/revoke.
 * If the revoked row is the caller's own session, the refreshed page
 * bounces to the login screen (401 → redirect server-side).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { RevokedResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedApiError } from "../lib/messages";

export function RevokeSessionButton({
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

  async function onRevoke(): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await bffFetch<RevokedResult>(
      `identity/sessions/${encodeURIComponent(sessionId)}/revoke`,
      { method: "POST" },
    );
    setBusy(false);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  return (
    <span>
      <button
        type="button"
        className="btn btn-danger btn-small"
        disabled={busy}
        onClick={() => {
          void onRevoke();
        }}
      >
        {busy ? d.loading : d.sessionsRevoke}
      </button>
      {error !== null && <p className="small" role="alert">{error}</p>}
    </span>
  );
}
