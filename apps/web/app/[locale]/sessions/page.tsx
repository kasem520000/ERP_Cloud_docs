/**
 * /{locale}/sessions — active sessions of the tenant with per-row revoke
 * buttons (POST /api/bff/identity/sessions/{id}/revoke). Revoking your own
 * session signs you out: the next render hits 401 → redirect to login.
 * tokenHash is part of the wire row but is never rendered here.
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { RevokeSessionButton } from "../../../components/revoke-session-button";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { TenantSessionRow } from "../../../lib/api-types";
import { formatDateTime, localizedApiError } from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const localeValue = locale as Locale;
  const d = getDictionary(localeValue);

  await requireSessionToken(localeValue);

  const sessions = await fetchApi<readonly TenantSessionRow[]>("identity/sessions/tenant");
  if (!sessions.ok && sessions.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!sessions.ok) {
    content = (
      <p className="alert alert-error" role="alert">
        {localizedApiError(d, sessions.error, sessions.retryAfterSeconds)}
      </p>
    );
  } else {
    content = (
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          {d.sessionsHint}
        </p>
        {sessions.data.length === 0 ? (
          <p className="muted">{d.sessionsEmpty}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{d.sessionsColUser}</th>
                  <th scope="col">{d.sessionsColCreated}</th>
                  <th scope="col">{d.sessionsColExpires}</th>
                  <th scope="col">{d.sessionsColLastSeen}</th>
                  <th scope="col">{d.sessionsColIp}</th>
                  <th scope="col">{d.usersColActions}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.data.map((session) => (
                  <tr key={session.id}>
                    <td className="mono small">{session.userId}</td>
                    <td>{formatDateTime(session.createdAt, localeValue)}</td>
                    <td>{formatDateTime(session.expiresAt, localeValue)}</td>
                    <td>{formatDateTime(session.lastSeenAt, localeValue)}</td>
                    <td className="mono small">{session.ip ?? "—"}</td>
                    <td>
                      <RevokeSessionButton locale={localeValue} sessionId={session.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="sessions" title={d.sessionsTitle}>
      {content}
    </AppShell>
  );
}
