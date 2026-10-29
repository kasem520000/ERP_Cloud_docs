"use client";

/**
 * P4-T12a — tenant profile form. PUT /api/bff/tenancy/profile
 * { name?, nameAr?, timezone? } (IANA-validated server-side; a datalist of
 * common MENA zones is offered as suggestions). An empty Arabic name is
 * simply omitted (the API treats it as "leave unchanged").
 */
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { TenantProfile } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedTenancyError } from "../lib/messages";
import { TIMEZONE_SUGGESTIONS } from "../lib/constants";

export function ProfileForm({
  locale,
  initial,
}: {
  locale: Locale;
  initial: { name: string; nameAr: string | null; timezone: string };
}): JSX.Element {
  const d = getDictionary(locale);
  const [name, setName] = useState(initial.name);
  const [nameAr, setNameAr] = useState(initial.nameAr ?? "");
  const [timezone, setTimezone] = useState(initial.timezone);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice(null);
    setError(null);
    if (name.trim() === "" || timezone.trim() === "") {
      setError(d.errorsValidation);
      return;
    }
    const body: Record<string, unknown> = { name: name.trim(), timezone: timezone.trim() };
    if (nameAr.trim() !== "") {
      body.nameAr = nameAr.trim();
    }
    setBusy(true);
    const result = await bffFetch<TenantProfile>("tenancy/profile", { method: "PUT", body });
    setBusy(false);
    if (!result.ok) {
      setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setNotice(d.settingsProfileSaved);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label" htmlFor="profile-name">
          {d.settingsNameLabel}
        </label>
        <input
          id="profile-name"
          className="input"
          type="text"
          name="name"
          required
          maxLength={200}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="profile-name-ar">
          {d.settingsNameArLabel}
        </label>
        <input
          id="profile-name-ar"
          className="input"
          type="text"
          name="nameAr"
          dir="rtl"
          maxLength={200}
          value={nameAr}
          onChange={(event) => {
            setNameAr(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="profile-timezone">
          {d.settingsTimezoneLabel}
        </label>
        <input
          id="profile-timezone"
          className="input"
          type="text"
          name="timezone"
          required
          maxLength={60}
          list="timezone-suggestions"
          value={timezone}
          onChange={(event) => {
            setTimezone(event.target.value);
          }}
        />
        <datalist id="timezone-suggestions">
          {TIMEZONE_SUGGESTIONS.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.settingsProfileSubmit}
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
