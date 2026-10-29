"use client";

/**
 * Password change: POST /api/bff/identity/password-change { current, next }.
 * The API revokes all other sessions and keeps this one alive. A 400/422
 * VALIDATION_ERROR here means the current password did not verify (the
 * client already enforces the ≥ 10-char policy on `next`).
 */
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { ChangedResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedApiError } from "../lib/messages";

const MIN_PASSWORD_LENGTH = 10;

export function ChangePasswordForm({ locale }: { locale: Locale }): JSX.Element {
  const d = getDictionary(locale);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotice(null);
    setError(null);
    if (current === "" || next.length < MIN_PASSWORD_LENGTH) {
      setError(`${d.passwordNextHint} ${d.errorsValidation}`);
      return;
    }
    setBusy(true);
    const result = await bffFetch<ChangedResult>("identity/password-change", {
      method: "POST",
      body: { current, next },
    });
    setBusy(false);
    if (result.ok) {
      setNotice(d.passwordSuccess);
      setCurrent("");
      setNext("");
      return;
    }
    if (result.error.code === "VALIDATION_ERROR") {
      setError(d.passwordErrorCurrent);
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  return (
    <form className="card" onSubmit={onSubmit} noValidate style={{ maxWidth: "26rem" }}>
      <div className="field">
        <label className="label" htmlFor="change-current">
          {d.passwordCurrentLabel}
        </label>
        <input
          id="change-current"
          className="input"
          type="password"
          name="current"
          autoComplete="current-password"
          required
          value={current}
          onChange={(event) => {
            setCurrent(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="change-next">
          {d.passwordNextLabel}
        </label>
        <input
          id="change-next"
          className="input"
          type="password"
          name="next"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={next}
          onChange={(event) => {
            setNext(event.target.value);
          }}
        />
        <span className="muted small">{d.passwordNextHint}</span>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.passwordSubmit}
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
