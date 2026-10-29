"use client";

/**
 * Clone a system role template into the tenant:
 * POST /api/bff/identity/roles/clone-template { templateKey }.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { RoleRow } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatMessage, localizedApiError } from "../lib/messages";

export function CloneTemplateButton({
  locale,
  templateKey,
  roleName,
}: {
  locale: Locale;
  templateKey: string;
  roleName: string;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onClone(): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await bffFetch<RoleRow>("identity/roles/clone-template", {
      method: "POST",
      body: { templateKey },
    });
    setBusy(false);
    if (result.ok) {
      setNotice(formatMessage(d.rolesCloned, { name: localRoleName(result.data) }));
      router.refresh();
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  function localRoleName(role: RoleRow): string {
    return locale === "ar" && role.nameAr !== null && role.nameAr !== "" ? role.nameAr : role.name;
  }

  return (
    <span>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        disabled={busy}
        onClick={() => {
          void onClone();
        }}
      >
        {busy ? d.loading : `${d.rolesClone} ${roleName}`}
      </button>
      {notice !== null && <p className="small" role="status">{notice}</p>}
      {error !== null && <p className="small" role="alert">{error}</p>}
    </span>
  );
}
