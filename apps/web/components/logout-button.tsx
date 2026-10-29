"use client";

/**
 * Logout: DELETE /api/bff/session (CSRF-echoed by the wrapper), then back to
 * the login screen. The BFF clears both cookies regardless of the upstream
 * result, so the browser ends signed-out either way.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import { bffFetch } from "../lib/client-api";

export function LogoutButton({ locale, label }: { locale: Locale; label: string }): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick(): Promise<void> {
    setBusy(true);
    await bffFetch("session", { method: "DELETE" });
    router.replace(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-secondary btn-small" onClick={onClick} disabled={busy}>
      {busy ? d.loading : label}
    </button>
  );
}
