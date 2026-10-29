"use client";

/**
 * P4-T12a — onboarding wizard (tenant plane). Step 1 collects the fiscal
 * start month + the numbering assign-at policy; POST
 * /api/bff/tenancy/onboarding/provision returns the idempotent diff; step 2
 * shows created-vs-existing counts (roles/accounts/purposes/settings) and —
 * when nothing was created — the "re-run produces zero duplicates" hint.
 */
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, monthNames, type Locale } from "../i18n/dictionaries";
import type { ProvisionDiff } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatMessage, localizedTenancyError } from "../lib/messages";

type AssignAt = "posting" | "approval";

export function OnboardingWizard({ locale }: { locale: Locale }): JSX.Element {
  const d = getDictionary(locale);
  const [step, setStep] = useState<1 | 2>(1);
  const [fiscalMonth, setFiscalMonth] = useState("1");
  const [assignAt, setAssignAt] = useState<AssignAt>("posting");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<ProvisionDiff | null>(null);

  async function onProvision(): Promise<void> {
    setBusy(true);
    setError(null);
    const result = await bffFetch<ProvisionDiff>("tenancy/onboarding/provision", {
      method: "POST",
      body: {
        fiscalCalendarStartMonth: Number.parseInt(fiscalMonth, 10),
        numberingAssignAt: assignAt,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setDiff(result.data);
    setStep(2);
  }

  if (step === 2 && diff !== null) {
    const createdNothing =
      diff.roles.created.length === 0 &&
      diff.accounts.created === 0 &&
      diff.purposes.created === 0 &&
      diff.settings.created.length === 0;
    return (
      <div className="stack">
        <section className="card" aria-label={d.onboardingResultTitle}>
          <h2 style={{ marginBlockStart: 0 }}>{d.onboardingResultTitle}</h2>
          <dl className="def-list">
            <div>
              <dt>{d.onboardingRolesLabel}</dt>
              <dd>
                {formatMessage(d.onboardingCreatedCount, {
                  created: diff.roles.created.length,
                  existing: diff.roles.existing.length,
                })}
                {diff.roles.created.length > 0 && (
                  <span className="mono small"> — {diff.roles.created.join(", ")}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{d.onboardingAccountsLabel}</dt>
              <dd>
                {formatMessage(d.onboardingCreatedCount, {
                  created: diff.accounts.created,
                  existing: diff.accounts.existing,
                })}
              </dd>
            </div>
            <div>
              <dt>{d.onboardingPurposesLabel}</dt>
              <dd>
                {formatMessage(d.onboardingCreatedCount, {
                  created: diff.purposes.created,
                  existing: diff.purposes.existing,
                })}
              </dd>
            </div>
            <div>
              <dt>{d.onboardingSettingsLabel}</dt>
              <dd>
                {formatMessage(d.onboardingCreatedCount, {
                  created: diff.settings.created.length,
                  existing: diff.settings.existing.length,
                })}
                {diff.settings.created.length > 0 && (
                  <span className="mono small"> — {diff.settings.created.join(", ")}</span>
                )}
              </dd>
            </div>
          </dl>
          {createdNothing && <p className="alert alert-success" role="status">{d.onboardingZeroDuplicatesHint}</p>}
        </section>
        <div className="form-actions">
          <a className="btn btn-primary" href={`/${locale}`}>
            {d.onboardingGoHome}
          </a>
          <a className="btn btn-secondary" href={`/${locale}/branches`}>
            {d.onboardingGoBranches}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        {d.onboardingSubtitle}
      </p>
      <section className="card" style={{ maxWidth: "30rem" }} aria-label={d.onboardingTitle}>
        <div className="field">
          <label className="label" htmlFor="onb-fiscal-month">
            {d.fiscalStartMonthLabel}
          </label>
          <select
            id="onb-fiscal-month"
            className="input"
            value={fiscalMonth}
            onChange={(event) => {
              setFiscalMonth(event.target.value);
            }}
          >
            {monthNames[locale].map((name, index) => (
              <option key={name} value={String(index + 1)}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="onb-assign-at">
            {d.numberingAssignAtLabel}
          </label>
          <select
            id="onb-assign-at"
            className="input"
            value={assignAt}
            onChange={(event) => {
              setAssignAt(event.target.value as AssignAt);
            }}
          >
            <option value="posting">{d.numberingAssignAtPosting}</option>
            <option value="approval">{d.numberingAssignAtApproval}</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void onProvision()}>
            {busy ? d.loading : d.onboardingProvisionButton}
          </button>
        </div>
        {error !== null && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
