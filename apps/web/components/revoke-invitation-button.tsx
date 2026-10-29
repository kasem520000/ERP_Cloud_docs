"use client";

/**
 * Revoke invitation: POST /api/bff/identity/invitations/{id}/revoke.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { RevokedResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedApiError } from "../lib/messages";

export function RevokeInvitationButton({
  locale,
  invitationId,
}: {
  locale: Locale;
  invitationId: string;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRevoke(): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await bffFetch<RevokedResult>(
      `identity/invitations/${encodeURIComponent(invitationId)}/revoke`,
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
        {busy ? d.loading : d.usersRevoke}
      </button>
      {error !== null && <p className="small" role="alert">{error}</p>}
    </span>
  );
}
