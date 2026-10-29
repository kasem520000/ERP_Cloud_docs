"use client";

/**
 * Password-reset request: POST /api/bff/identity/password-resets (public,
 * no session → no CSRF echo needed). Always the same success message.
 */
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { AcceptedResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedApiError } from "../lib/messages";

export function ForgotPasswordForm({ locale }: { locale: Locale }): JSX.Element {
  const d = getDictionary(locale);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await bffFetch<AcceptedResult>("identity/password-resets", {
      method: "POST",
      body: { email },
    });
    setBusy(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <p className="muted" style={{ marginBlockStart: 0 }}>
        {d.forgotDescription}
      </p>
      <div className="field">
        <label className="label" htmlFor="forgot-email">
          {d.forgotEmailLabel}
        </label>
        <input
          id="forgot-email"
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.forgotSubmit}
        </button>
      </div>
      {sent && (
        <p className="alert alert-success" role="status">
          {d.forgotSuccess}
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
