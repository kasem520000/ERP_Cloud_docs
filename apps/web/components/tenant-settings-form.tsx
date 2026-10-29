"use client";

/**
 * P4-T12a — typed tenant-settings cards. Every field saves INDIVIDUALLY via
 * PUT /api/bff/tenancy/settings/:key { value } with per-field saved/error
 * feedback (schema-validated server-side; unknown keys are impossible from
 * this UI). The tax registration status+number pair keeps the API's
 * cross-key rule visible (number required while REGISTERED, rejected
 * otherwise) — both fields therefore keep separate save buttons.
 */
import { useState } from "react";
import type { JSX } from "react";

import { getDictionary, monthNames, type Locale } from "../i18n/dictionaries";
import { isRecord, type TenantSettingsMap } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedTenancyError } from "../lib/messages";

type FieldFeedback = { state: "saving" | "saved" | "error"; message?: string };
type AssignAt = "approval" | "posting";
type TaxStatus = "REGISTERED" | "NOT_REGISTERED" | "DEREGISTERED";

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asMonth(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12 ? value : 1;
}

function asAssignAt(value: unknown): AssignAt {
  return isRecord(value) && value.assign_at === "approval" ? "approval" : "posting";
}

function asTaxStatus(value: unknown): TaxStatus {
  return value === "REGISTERED" || value === "DEREGISTERED" ? value : "NOT_REGISTERED";
}

export function TenantSettingsForm({
  locale,
  settings,
}: {
  locale: Locale;
  settings: TenantSettingsMap;
}): JSX.Element {
  const d = getDictionary(locale);
  const [defaultLocale, setDefaultLocale] = useState(asString(settings["general.default_locale"], "ar"));
  const [numeralSystem, setNumeralSystem] = useState(asString(settings["general.numeral_system"], "latn"));
  const [hijriDisplay, setHijriDisplay] = useState(asBool(settings["general.hijri_display"], true));
  const [fiscalMonth, setFiscalMonth] = useState(asMonth(settings["fiscal_calendar.start_month"]));
  const [assignAt, setAssignAt] = useState(asAssignAt(settings["numbering.defaults"]));
  const [supportOptIn, setSupportOptIn] = useState(asBool(settings["platform.support.opt_in"], false));
  const [taxStatus, setTaxStatus] = useState<TaxStatus>(asTaxStatus(settings["tax.registration.status"]));
  const [taxNumber, setTaxNumber] = useState(asString(settings["tax.registration.number"], ""));
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, FieldFeedback>>({});

  async function save(key: string, value: unknown): Promise<void> {
    setBusyKey(key);
    setFeedback((previous) => ({ ...previous, [key]: { state: "saving" } }));
    const result = await bffFetch<unknown>(`tenancy/settings/${key}`, {
      method: "PUT",
      body: { value },
    });
    setBusyKey(null);
    if (result.ok) {
      setFeedback((previous) => ({ ...previous, [key]: { state: "saved" } }));
      return;
    }
    setFeedback((previous) => ({
      ...previous,
      [key]: {
        state: "error",
        message: localizedTenancyError(d, result.error, result.retryAfterSeconds),
      },
    }));
  }

  function feedbackOf(key: string): JSX.Element | null {
    const field = feedback[key];
    if (field === undefined) {
      return null;
    }
    if (field.state === "saving") {
      return <span className="setting-feedback">{d.loading}</span>;
    }
    if (field.state === "saved") {
      return <span className="setting-feedback saved" role="status">{`✓ ${d.settingsSaved}`}</span>;
    }
    return (
      <span className="setting-feedback error" role="alert">
        {field.message}
      </span>
    );
  }

  const saveButton = (key: string): JSX.Element => (
    <button
      type="button"
      className="btn btn-secondary btn-small"
      disabled={busyKey !== null}
      onClick={() => {
        void save(key, currentValueOf(key));
      }}
    >
      {busyKey === key ? d.loading : d.settingsSave}
    </button>
  );

  function currentValueOf(key: string): unknown {
    switch (key) {
      case "general.default_locale":
        return defaultLocale;
      case "general.numeral_system":
        return numeralSystem;
      case "general.hijri_display":
        return hijriDisplay;
      case "fiscal_calendar.start_month":
        return fiscalMonth;
      case "numbering.defaults":
        return { assign_at: assignAt };
      case "platform.support.opt_in":
        return supportOptIn;
      case "tax.registration.status":
        return taxStatus;
      default:
        return undefined;
    }
  }

  function onTaxNumberSave(): void {
    if (taxNumber.trim().length < 3) {
      setFeedback((previous) => ({
        ...previous,
        "tax.registration.number": { state: "error", message: d.errorsValidation },
      }));
      return;
    }
    void save("tax.registration.number", taxNumber.trim());
  }

  return (
    <div className="stack">
      <section className="card" aria-label={d.settingsGeneralTitle}>
        <h2 style={{ marginBlockStart: 0 }}>{d.settingsGeneralTitle}</h2>
        <div className="setting-row">
          <label className="label" htmlFor="set-default-locale">
            {d.settingsDefaultLocaleLabel}
          </label>
          <select
            id="set-default-locale"
            className="input"
            style={{ maxInlineSize: "14rem" }}
            value={defaultLocale}
            onChange={(event) => {
              setDefaultLocale(event.target.value);
            }}
          >
            <option value="ar">{d.localeArabic}</option>
            <option value="en">{d.localeEnglish}</option>
          </select>
          {saveButton("general.default_locale")}
          {feedbackOf("general.default_locale")}
        </div>
        <div className="setting-row">
          <label className="label" htmlFor="set-numeral-system">
            {d.settingsNumeralSystemLabel}
          </label>
          <select
            id="set-numeral-system"
            className="input"
            style={{ maxInlineSize: "14rem" }}
            value={numeralSystem}
            onChange={(event) => {
              setNumeralSystem(event.target.value);
            }}
          >
            <option value="latn">{d.settingsNumeralLatn}</option>
            <option value="arab">{d.settingsNumeralArab}</option>
          </select>
          {saveButton("general.numeral_system")}
          {feedbackOf("general.numeral_system")}
        </div>
        <div className="setting-row">
          <span className="label" id="set-hijri-label">
            {d.settingsHijriLabel}
          </span>
          <span className="inline-field">
            <input
              id="set-hijri"
              type="checkbox"
              name="hijri"
              aria-labelledby="set-hijri-label"
              checked={hijriDisplay}
              onChange={(event) => {
                setHijriDisplay(event.target.checked);
              }}
            />
            <span className="muted small">{d.settingsHijriHint}</span>
          </span>
          {saveButton("general.hijri_display")}
          {feedbackOf("general.hijri_display")}
        </div>
      </section>

      <section className="card" aria-label={d.settingsFiscalNumberingTitle}>
        <h2 style={{ marginBlockStart: 0 }}>{d.settingsFiscalNumberingTitle}</h2>
        <div className="setting-row">
          <label className="label" htmlFor="set-fiscal-month">
            {d.fiscalStartMonthLabel}
          </label>
          <select
            id="set-fiscal-month"
            className="input"
            style={{ maxInlineSize: "14rem" }}
            value={String(fiscalMonth)}
            onChange={(event) => {
              setFiscalMonth(Number.parseInt(event.target.value, 10));
            }}
          >
            {monthNames[locale].map((name, index) => (
              <option key={name} value={String(index + 1)}>
                {name}
              </option>
            ))}
          </select>
          {saveButton("fiscal_calendar.start_month")}
          {feedbackOf("fiscal_calendar.start_month")}
        </div>
        <div className="setting-row">
          <label className="label" htmlFor="set-assign-at">
            {d.numberingAssignAtLabel}
          </label>
          <select
            id="set-assign-at"
            className="input"
            style={{ maxInlineSize: "14rem" }}
            value={assignAt}
            onChange={(event) => {
              setAssignAt(event.target.value as AssignAt);
            }}
          >
            <option value="posting">{d.numberingAssignAtPosting}</option>
            <option value="approval">{d.numberingAssignAtApproval}</option>
          </select>
          {saveButton("numbering.defaults")}
          {feedbackOf("numbering.defaults")}
        </div>
      </section>

      <section className="card" aria-label={d.settingsSupportTitle}>
        <h2 style={{ marginBlockStart: 0 }}>{d.settingsSupportTitle}</h2>
        <p className="alert alert-info" role="note">
          {d.settingsSupportOptInWarning}
        </p>
        <div className="setting-row">
          <span className="label" id="set-optin-label">
            {d.settingsSupportOptInLabel}
          </span>
          <span className="inline-field">
            <input
              id="set-optin"
              type="checkbox"
              name="supportOptIn"
              aria-labelledby="set-optin-label"
              checked={supportOptIn}
              onChange={(event) => {
                setSupportOptIn(event.target.checked);
              }}
            />
          </span>
          {saveButton("platform.support.opt_in")}
          {feedbackOf("platform.support.opt_in")}
        </div>
      </section>

      <section className="card" aria-label={d.settingsTaxTitle}>
        <h2 style={{ marginBlockStart: 0 }}>{d.settingsTaxTitle}</h2>
        <p className="muted small" style={{ marginBlock: 0 }}>
          {d.settingsTaxPairHint}
        </p>
        <div className="setting-row">
          <label className="label" htmlFor="set-tax-status">
            {d.taxStatusLabel}
          </label>
          <select
            id="set-tax-status"
            className="input"
            style={{ maxInlineSize: "14rem" }}
            value={taxStatus}
            onChange={(event) => {
              setTaxStatus(event.target.value as TaxStatus);
            }}
          >
            <option value="NOT_REGISTERED">{d.taxStatusNotRegistered}</option>
            <option value="REGISTERED">{d.taxStatusRegistered}</option>
            <option value="DEREGISTERED">{d.taxStatusDeregistered}</option>
          </select>
          {saveButton("tax.registration.status")}
          {feedbackOf("tax.registration.status")}
        </div>
        <div className="setting-row">
          <label className="label" htmlFor="set-tax-number">
            {d.taxNumberLabel}
          </label>
          <input
            id="set-tax-number"
            className="input"
            style={{ maxInlineSize: "14rem" }}
            type="text"
            minLength={3}
            maxLength={50}
            value={taxNumber}
            onChange={(event) => {
              setTaxNumber(event.target.value);
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={busyKey !== null || taxNumber.trim() === ""}
            onClick={() => {
              onTaxNumberSave();
            }}
          >
            {busyKey === "tax.registration.number" ? d.loading : d.settingsSave}
          </button>
          {feedbackOf("tax.registration.number")}
        </div>
      </section>
    </div>
  );
}
