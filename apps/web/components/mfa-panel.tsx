"use client";

/**
 * MFA setup wizard:
 *  1. enroll  → POST /api/bff/identity/mfa/totp/enroll (secret + otpauth);
 *  2. verify  → POST /api/bff/identity/mfa/totp/verify { code };
 *  3. recovery codes → POST /api/bff/identity/mfa/recovery-codes
 *     (shown ONCE; the API stores only hashes).
 */
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { ConfirmedResult, MfaEnrollResult, RecoveryCodesResult } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedApiError } from "../lib/messages";

type Phase = "idle" | "enrolled" | "confirmed";

export function MfaPanel({ locale }: { locale: Locale }): JSX.Element {
  const d = getDictionary(locale);
  const [phase, setPhase] = useState<Phase>("idle");
  const [enrollment, setEnrollment] = useState<MfaEnrollResult | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<readonly string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onEnroll(): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await bffFetch<MfaEnrollResult>("identity/mfa/totp/enroll", { method: "POST" });
    setBusy(false);
    if (result.ok) {
      setEnrollment(result.data);
      setPhase("enrolled");
      setCodes(null);
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  async function onVerify(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await bffFetch<ConfirmedResult>("identity/mfa/totp/verify", {
      method: "POST",
      body: { code },
    });
    setBusy(false);
    if (result.ok) {
      setPhase("confirmed");
      setNotice(d.mfaVerified);
      setCode("");
      return;
    }
    if (result.error.code === "VALIDATION_ERROR") {
      setError(d.mfaInvalidCode);
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  async function onRecoveryCodes(): Promise<void> {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await bffFetch<RecoveryCodesResult>("identity/mfa/recovery-codes", {
      method: "POST",
    });
    setBusy(false);
    if (result.ok) {
      setCodes(result.data.codes);
      return;
    }
    if (result.error.code === "NOT_FOUND") {
      setError(d.mfaNeedConfirmed);
      return;
    }
    setError(localizedApiError(d, result.error, result.retryAfterSeconds));
  }

  return (
    <div className="stack">
      <p className="muted" style={{ margin: 0 }}>
        {d.mfaDescription}
      </p>

      <section className="card" aria-label={d.mfaEnrollTitle}>
        <h2 style={{ marginBlockStart: 0 }}>{d.mfaEnrollTitle}</h2>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => {
            void onEnroll();
          }}
        >
          {busy ? d.loading : d.mfaEnrollButton}
        </button>
      </section>

      {phase !== "idle" && enrollment !== null && (
        <section className="card" aria-label={d.mfaVerifyTitle}>
          <h2 style={{ marginBlockStart: 0 }}>{d.mfaVerifyTitle}</h2>
          <div className="field">
            <span className="label">{d.mfaSecretLabel}</span>
            <div className="code-box">{enrollment.secret}</div>
          </div>
          <div className="field">
            <span className="label">{d.mfaOtpauthLabel}</span>
            <div className="code-box">{enrollment.otpauth}</div>
          </div>
          <p className="muted small">{d.mfaEnrollHint}</p>
          <form onSubmit={onVerify} noValidate>
            <div className="field">
              <label className="label" htmlFor="mfa-code">
                {d.mfaVerifyCodeLabel}
              </label>
              <input
                id="mfa-code"
                className="input"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                minLength={6}
                maxLength={10}
                required
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                }}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? d.loading : d.mfaVerifySubmit}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card" aria-label={d.mfaRecoveryTitle}>
        <h2 style={{ marginBlockStart: 0 }}>{d.mfaRecoveryTitle}</h2>
        <p className="muted small" style={{ marginBlock: 0 }}>
          {d.mfaRecoveryDescription}
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => {
              void onRecoveryCodes();
            }}
          >
            {busy ? d.loading : codes === null ? d.mfaRecoveryGenerate : d.mfaRecoveryRegenerate}
          </button>
        </div>
        {codes !== null && (
          <ol className="recovery-list" aria-live="polite">
            {codes.map((recoveryCode) => (
              <li key={recoveryCode}>{recoveryCode}</li>
            ))}
          </ol>
        )}
      </section>

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
