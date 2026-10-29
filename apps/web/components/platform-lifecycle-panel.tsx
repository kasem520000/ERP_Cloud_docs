"use client";

/**
 * P4-T12a — platform lifecycle panel (inline; reason is required by the API,
 * min 3 chars). POST /api/bff/platform/tenants/:id/suspend | /restore
 * { reason } — suspend also reports the killed session count (rule-6).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { RestoreResult, SuspendResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatMessage, localizedTenancyError } from "../lib/messages";

const MIN_REASON_LENGTH = 3;

export function PlatformLifecyclePanel({
  locale,
  tenantId,
  status,
}: {
  locale: Locale;
  tenantId: string;
  status: string;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSuspend = status === "ACTIVE";
  const canRestore = status === "SUSPENDED";

  async function onTransition(suspend: boolean): Promise<void> {
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(d.errorsValidation);
      return;
    }
    const path = `platform/tenants/${encodeURIComponent(tenantId)}/${suspend ? "suspend" : "restore"}`;
    setBusy(true);
    setError(null);
    setNotice(null);
    if (suspend) {
      const result = await bffFetch<SuspendResult>(path, {
        method: "POST",
        body: { reason: reason.trim() },
      });
      setBusy(false);
      if (!result.ok) {
        setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
        return;
      }
      setNotice(formatMessage(d.platformSuspendDone, { count: result.data.killedSessions }));
    } else {
      const result = await bffFetch<RestoreResult>(path, {
        method: "POST",
        body: { reason: reason.trim() },
      });
      setBusy(false);
      if (!result.ok) {
        setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
        return;
      }
      setNotice(d.platformRestoreDone);
    }
    setReason("");
    router.refresh();
  }

  if (!canSuspend && !canRestore) {
    return <p className="muted" style={{ margin: 0 }}>—</p>;
  }

  return (
    <div>
      <div className="inline-field">
        <label className="label" htmlFor={`lifecycle-reason-${tenantId}`}>
          {d.platformReasonLabel}
        </label>
        <input
          id={`lifecycle-reason-${tenantId}`}
          className="input"
          type="text"
          maxLength={500}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
        />
        <button
          type="button"
          className={`btn btn-small ${canSuspend ? "btn-danger" : "btn-primary"}`}
          disabled={busy}
          onClick={() => {
            void onTransition(canSuspend);
          }}
        >
          {busy ? d.loading : canSuspend ? d.platformSuspendButton : d.platformRestoreButton}
        </button>
      </div>
      {notice !== null && (
        <p className="alert alert-success" role="status">
          {notice}
        </p>
      )}
      {error !== null && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
