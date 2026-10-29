"use client";

/**
 * P4-T12a — manual plan assignment. POST /api/bff/platform/tenants/:id/plan
 * { planKey, trialDays? } → { planKey, grantedKeys } (audited dual: platform
 * row + tenant-visible row).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { PlanAssignResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatMessage, localizedTenancyError } from "../lib/messages";
import { PLAN_KEYS, type PlanKey } from "../lib/constants";

export function PlatformPlanForm({
  locale,
  tenantId,
  currentPlanKey,
}: {
  locale: Locale;
  tenantId: string;
  currentPlanKey: string | null;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [planKey, setPlanKey] = useState<PlanKey>(
    currentPlanKey !== null && (PLAN_KEYS as readonly string[]).includes(currentPlanKey)
      ? (currentPlanKey as PlanKey)
      : "starter",
  );
  const [trialDays, setTrialDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const body: Record<string, unknown> = { planKey };
    const days = Number.parseInt(trialDays, 10);
    if (!Number.isNaN(days) && trialDays.trim() !== "" && days >= 1 && days <= 365) {
      body.trialDays = days;
    }
    const result = await bffFetch<PlanAssignResult>(`platform/tenants/${encodeURIComponent(tenantId)}/plan`, {
      method: "POST",
      body,
    });
    setBusy(false);
    if (!result.ok) {
      setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setNotice(
      formatMessage(d.platformPlanAssigned, { plan: result.data.planKey, count: result.data.grantedKeys }),
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="stack" style={{ gap: "0.6rem" }}>
      <div className="inline-field">
        <label className="label" htmlFor={`plan-key-${tenantId}`}>
          {d.platformPlanLabel}
        </label>
        <select
          id={`plan-key-${tenantId}`}
          className="input"
          style={{ maxInlineSize: "12rem" }}
          value={planKey}
          onChange={(event) => {
            setPlanKey(event.target.value as PlanKey);
          }}
        >
          {PLAN_KEYS.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        <label className="label" htmlFor={`plan-trial-${tenantId}`}>
          {d.platformTrialDaysLabel}
        </label>
        <input
          id={`plan-trial-${tenantId}`}
          className="input"
          style={{ maxInlineSize: "7rem" }}
          type="number"
          min={1}
          max={365}
          value={trialDays}
          onChange={(event) => {
            setTrialDays(event.target.value);
          }}
        />
        <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
          {busy ? d.loading : d.platformPlanSubmit}
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
    </form>
  );
}
