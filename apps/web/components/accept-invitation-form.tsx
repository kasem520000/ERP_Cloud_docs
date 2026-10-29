"use client";

/**
 * Invitation acceptance: POST /api/bff/session/accept { token, fullName,
 * password, locale } — on success the BFF sets the session cookie and the
 * user lands on the dashboard. Client-side the password must be ≥ 10 chars.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { AcceptInvitationResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedInvitationError } from "../lib/messages";

const MIN_PASSWORD_LENGTH = 10;

export function AcceptInvitationForm({
  locale,
  token,
}: {
  locale: Locale;
  token: string;
}): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (fullName === "" || password.length < MIN_PASSWORD_LENGTH) {
      setError(`${d.acceptPasswordHint} ${d.errorsValidation}`);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await bffFetch<AcceptInvitationResult>("session/accept", {
      method: "POST",
      body: { token, fullName, password, locale },
    });
    if (result.ok) {
      router.replace(`/${locale}`);
      router.refresh();
      return;
    }
    setError(localizedInvitationError(d, result.error));
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate style={{ marginBlockStart: "1rem" }}>
      <div className="field">
        <label className="label" htmlFor="accept-name">
          {d.acceptFullNameLabel}
        </label>
        <input
          id="accept-name"
          className="input"
          type="text"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="accept-password">
          {d.acceptPasswordLabel}
        </label>
        <input
          id="accept-password"
          className="input"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
        <span className="muted small">{d.acceptPasswordHint}</span>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.acceptSubmit}
        </button>
      </div>
      {error !== null && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
