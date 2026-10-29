"use client";

/**
 * Login form. Errors are localized by stable code:
 * INVALID_CREDENTIALS / MFA_REQUIRED (reveals the MFA field) /
 * RATE_LIMITED + Retry-After / UNAUTHENTICATED (= account lockout window).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { LoginResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedLoginError } from "../lib/messages";

export function LoginForm({ locale }: { locale: Locale }): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showMfa, setShowMfa] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const body: Record<string, string> = { email, password };
    if (showMfa && mfaCode !== "") {
      body.mfaCode = mfaCode;
    }
    const result = await bffFetch<LoginResult>("session", { method: "POST", body });
    if (result.ok) {
      router.replace(`/${locale}`);
      router.refresh();
      return;
    }
    if (result.error.code === "MFA_REQUIRED") {
      setShowMfa(true);
    }
    setError(localizedLoginError(d, result.error, result.retryAfterSeconds));
    setBusy(false);
  }

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <p className="muted" style={{ marginBlockStart: 0 }}>
        {d.loginSubtitle}
      </p>
      <div className="field">
        <label className="label" htmlFor="login-email">
          {d.loginEmailLabel}
        </label>
        <input
          id="login-email"
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
      <div className="field">
        <label className="label" htmlFor="login-password">
          {d.loginPasswordLabel}
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        />
      </div>
      {showMfa && (
        <div className="field">
          <label className="label" htmlFor="login-mfa">
            {d.loginMfaLabel}
          </label>
          <input
            id="login-mfa"
            className="input"
            type="text"
            name="mfaCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={mfaCode}
            onChange={(event) => {
              setMfaCode(event.target.value);
            }}
          />
          <span className="muted small">{d.loginMfaHint}</span>
        </div>
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.loginSubmit}
        </button>
        <button
          type="button"
          className="linklike"
          onClick={() => {
            setShowMfa(!showMfa);
          }}
        >
          {showMfa ? d.loginMfaHide : d.loginMfaShow}
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
