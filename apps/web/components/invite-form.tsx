"use client";

/**
 * Invite form: POST /api/bff/identity/invitations { email, roleId }.
 * Dev has no browser-visible mail delivery, so the issued accept link
 * (acceptPath contains the token) is surfaced right in the UI.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { IssuedInvitation } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { formatDateTime, localizedApiError } from "../lib/messages";

export interface InviteRole {
  id: string;
  label: string;
  key: string;
}

function extractToken(acceptPath: string): string | null {
  const queryIndex = acceptPath.indexOf("?");
  if (queryIndex === -1) {
    return null;
  }
  const params = new URLSearchParams(acceptPath.slice(queryIndex + 1));
  const token = params.get("token");
  return token !== null && token !== "" ? token : null;
}

export function InviteForm({ locale, roles }: { locale: Locale; roles: InviteRole[] }): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles.length > 0 ? (roles[0]?.id ?? "") : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ acceptHref: string; expiresAt: string } | null>(null);

  if (roles.length === 0) {
    return <p className="muted">{d.usersNoRoles}</p>;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (email === "" || roleId === "") {
      setError(d.errorsValidation);
      return;
    }
    setBusy(true);
    setError(null);
    setIssued(null);
    const result = await bffFetch<IssuedInvitation>("identity/invitations", {
      method: "POST",
      body: { email, roleId },
    });
    setBusy(false);
    if (!result.ok) {
      setError(localizedApiError(d, result.error, result.retryAfterSeconds));
      return;
    }
    const token = extractToken(result.data.acceptPath);
    setIssued({
      acceptHref:
        token === null
          ? result.data.acceptPath
          : `/${locale}/accept-invitation?token=${encodeURIComponent(token)}`,
      expiresAt: result.data.expiresAt,
    });
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label" htmlFor="invite-email">
          {d.usersInviteEmailLabel}
        </label>
        <input
          id="invite-email"
          className="input"
          type="email"
          name="email"
          autoComplete="off"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="invite-role">
          {d.usersInviteRoleLabel}
        </label>
        <select
          id="invite-role"
          className="input"
          name="roleId"
          required
          value={roleId}
          onChange={(event) => {
            setRoleId(event.target.value);
          }}
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label} ({role.key})
            </option>
          ))}
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.usersInviteSubmit}
        </button>
      </div>
      {error !== null && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {issued !== null && (
        <div className="alert alert-success" role="status">
          <p style={{ margin: 0 }}>{d.usersInviteLinkTitle}</p>
          <p style={{ margin: "0.4rem 0" }}>
            <a href={issued.acceptHref}>{issued.acceptHref}</a>
          </p>
          <p className="small" style={{ margin: 0 }}>
            {d.usersInviteExpiresLabel} {formatDateTime(issued.expiresAt, locale)}
          </p>
        </div>
      )}
    </form>
  );
}
