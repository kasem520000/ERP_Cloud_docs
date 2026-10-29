"use client";

/**
 * P4-T12a — registration form (public). POST /api/bff/platform/register:
 *
 *  - the base currency is DERIVED from the selected country (display-only,
 *    the API derives/validates it server-side too);
 *  - the tax number is required while the status is REGISTERED;
 *  - error contract: 409 tenancy/email-already-registered → friendly message;
 *    422 tenancy/invalid-registration-input → the display-safe API message;
 *    429 RATE_LIMITED → localized message + Retry-After seconds.
 */
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { RegisterResult, RegistrationOptions } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatDateTime, formatMessage, localizedTenancyError, localizedName } from "../lib/messages";

const MIN_PASSWORD_LENGTH = 10;

type TaxStatus = "REGISTERED" | "NOT_REGISTERED" | "DEREGISTERED";

export function RegisterForm({
  locale,
  options,
}: {
  locale: Locale;
  options: RegistrationOptions;
}): JSX.Element {
  const d = getDictionary(locale);
  const [businessName, setBusinessName] = useState("");
  const [businessNameAr, setBusinessNameAr] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [templateKey, setTemplateKey] = useState(
    options.industryTemplates.length > 0 ? (options.industryTemplates[0]?.key ?? "") : "",
  );
  const [taxStatus, setTaxStatus] = useState<TaxStatus>("NOT_REGISTERED");
  const [taxNumber, setTaxNumber] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RegisterResult | null>(null);

  const selectedCountry = options.countries.find((country) => country.code === countryCode);
  const baseCurrency = selectedCountry?.currencyCode ?? "";
  const currencyName = baseCurrency === ""
    ? ""
    : localizedName(
        options.currencies.find((currency) => currency.code === baseCurrency)?.name ?? baseCurrency,
        options.currencies.find((currency) => currency.code === baseCurrency)?.nameAr ?? null,
        locale,
      );

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    if (
      businessName === "" ||
      countryCode === "" ||
      templateKey === "" ||
      ownerEmail === "" ||
      ownerFullName === "" ||
      ownerPassword.length < MIN_PASSWORD_LENGTH
    ) {
      setError(d.errorsValidation);
      return;
    }
    if (taxStatus === "REGISTERED" && taxNumber.trim() === "") {
      setError(d.registerTaxNumberHint);
      return;
    }
    const body: Record<string, unknown> = {
      businessName,
      countryCode,
      baseCurrency,
      industryTemplateKey: templateKey,
      taxRegistrationStatus: taxStatus,
      ownerEmail,
      ownerFullName,
      ownerPassword,
    };
    if (businessNameAr !== "") {
      body.businessNameAr = businessNameAr;
    }
    if (taxStatus === "REGISTERED") {
      body.taxRegistrationNumber = taxNumber.trim();
    }
    setBusy(true);
    const result = await bffFetch<RegisterResult>("platform/register", { method: "POST", body });
    setBusy(false);
    if (result.ok) {
      setSuccess(result.data);
      return;
    }
    setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
  }

  if (success !== null) {
    return (
      <div className="card" role="status">
        <h2 style={{ marginBlockStart: 0 }}>{d.registerSuccessTitle}</h2>
        <p>
          {formatMessage(d.registerSuccessBody, {
            email: success.ownerEmail,
            date: formatDateTime(success.trialExpiresAt, locale),
          })}
        </p>
        <div className="form-actions">
          <a className="btn btn-primary" href={`/${locale}/login`}>
            {d.registerGoLogin}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={onSubmit} noValidate style={{ maxWidth: "34rem" }}>
      <p className="muted" style={{ marginBlockStart: 0 }}>
        {d.registerSubtitle}
      </p>

      <div className="field">
        <label className="label" htmlFor="reg-business-name">
          {d.registerBusinessNameLabel}
        </label>
        <input
          id="reg-business-name"
          className="input"
          type="text"
          name="businessName"
          required
          maxLength={200}
          value={businessName}
          onChange={(event) => {
            setBusinessName(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="reg-business-name-ar">
          {d.registerBusinessNameArLabel}
        </label>
        <input
          id="reg-business-name-ar"
          className="input"
          type="text"
          name="businessNameAr"
          dir="rtl"
          maxLength={200}
          value={businessNameAr}
          onChange={(event) => {
            setBusinessNameAr(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="reg-country">
          {d.registerCountryLabel}
        </label>
        <select
          id="reg-country"
          className="input"
          name="countryCode"
          required
          value={countryCode}
          onChange={(event) => {
            setCountryCode(event.target.value);
          }}
        >
          <option value="">—</option>
          {options.countries.map((country) => (
            <option key={country.code} value={country.code}>
              {localizedName(country.name, country.nameAr, locale)} ({country.code})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <span className="label">{d.registerCurrencyLabel}</span>
        <p className="mono" style={{ margin: 0 }}>
          {baseCurrency === "" ? "—" : `${baseCurrency}${currencyName === "" ? "" : ` — ${currencyName}`}`}
        </p>
      </div>
      <div className="field">
        <label className="label" htmlFor="reg-template">
          {d.registerTemplateLabel}
        </label>
        <select
          id="reg-template"
          className="input"
          name="industryTemplateKey"
          required
          value={templateKey}
          onChange={(event) => {
            setTemplateKey(event.target.value);
          }}
        >
          {options.industryTemplates.map((template) => (
            <option key={template.key} value={template.key}>
              {`${localizedName(template.name, template.nameAr, locale)} (${template.key})`}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label" htmlFor="reg-tax-status">
          {d.taxStatusLabel}
        </label>
        <select
          id="reg-tax-status"
          className="input"
          name="taxRegistrationStatus"
          value={taxStatus}
          onChange={(event) => {
            setTaxStatus(event.target.value as TaxStatus);
          }}
        >
          <option value="NOT_REGISTERED">{d.taxStatusNotRegistered}</option>
          <option value="REGISTERED">{d.taxStatusRegistered}</option>
          <option value="DEREGISTERED">{d.taxStatusDeregistered}</option>
        </select>
      </div>
      {taxStatus === "REGISTERED" && (
        <div className="field">
          <label className="label" htmlFor="reg-tax-number">
            {d.taxNumberLabel}
          </label>
          <input
            id="reg-tax-number"
            className="input"
            type="text"
            name="taxRegistrationNumber"
            required
            minLength={3}
            maxLength={50}
            value={taxNumber}
            onChange={(event) => {
              setTaxNumber(event.target.value);
            }}
          />
          <span className="muted small">{d.registerTaxNumberHint}</span>
        </div>
      )}

      <h2>{d.registerOwnerSection}</h2>
      <div className="field">
        <label className="label" htmlFor="reg-owner-email">
          {d.registerOwnerEmailLabel}
        </label>
        <input
          id="reg-owner-email"
          className="input"
          type="email"
          name="ownerEmail"
          autoComplete="email"
          required
          maxLength={200}
          value={ownerEmail}
          onChange={(event) => {
            setOwnerEmail(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="reg-owner-name">
          {d.registerOwnerNameLabel}
        </label>
        <input
          id="reg-owner-name"
          className="input"
          type="text"
          name="ownerFullName"
          autoComplete="name"
          required
          maxLength={200}
          value={ownerFullName}
          onChange={(event) => {
            setOwnerFullName(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="reg-owner-password">
          {d.loginPasswordLabel}
        </label>
        <input
          id="reg-owner-password"
          className="input"
          type="password"
          name="ownerPassword"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={ownerPassword}
          onChange={(event) => {
            setOwnerPassword(event.target.value);
          }}
        />
        <span className="muted small">{d.acceptPasswordHint}</span>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.registerSubmit}
        </button>
        <a href={`/${locale}/login`}>{d.registerGoLogin}</a>
      </div>
      {error !== null && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
