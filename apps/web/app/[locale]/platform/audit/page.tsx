/**
 * P4-T12a — /{locale}/platform/audit (platform admin): the cross-tenant audit
 * viewer. Filters (platformOnly checkbox, tenantId, action) submit as a GET
 * form; pagination rides the opaque cursor in the URL (meta.nextCursor from
 * the paginated envelope) with a next-page link that preserves the filters.
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../../components/app-shell";
import { getDictionary, isLocale, type Locale } from "../../../../i18n/dictionaries";
import type { PlatformAuditEvent } from "../../../../lib/api-types";
import { formatDateTime, localizedApiError } from "../../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../../lib/server-api";

const PAGE_LIMIT = 200;

export default async function PlatformAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<JSX.Element> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const localeValue = locale as Locale;
  const d = getDictionary(localeValue);

  await requireSessionToken(localeValue);

  const query = await searchParams;
  const platformOnly = query.platformOnly === "true" || query.platformOnly === "on";
  const tenantId = typeof query.tenantId === "string" ? query.tenantId.trim() : "";
  const action = typeof query.action === "string" ? query.action.trim() : "";
  const cursor = typeof query.cursor === "string" ? query.cursor : "";

  const search = new URLSearchParams({ limit: String(PAGE_LIMIT) });
  if (platformOnly) {
    search.set("platformOnly", "true");
  }
  if (tenantId !== "") {
    search.set("tenantId", tenantId);
  }
  if (action !== "") {
    search.set("action", action);
  }
  if (cursor !== "") {
    search.set("cursor", cursor);
  }

  const events = await fetchApi<readonly PlatformAuditEvent[]>(`platform/audit/events?${search.toString()}`);
  if (!events.ok && events.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!events.ok) {
    content =
      events.status === 403 || events.error.code === "FORBIDDEN" ? (
        <p className="alert alert-info" role="alert">
          {d.platformNoAccess}
        </p>
      ) : (
        <p className="alert alert-error" role="alert">
          {localizedApiError(d, events.error, events.retryAfterSeconds)}
        </p>
      );
  } else {
    const nextCursor = events.meta?.nextCursor;
    const nextLink = new URLSearchParams();
    if (platformOnly) {
      nextLink.set("platformOnly", "true");
    }
    if (tenantId !== "") {
      nextLink.set("tenantId", tenantId);
    }
    if (action !== "") {
      nextLink.set("action", action);
    }
    if (nextCursor !== undefined) {
      nextLink.set("cursor", nextCursor);
    }

    content = (
      <div className="stack">
        <form method="get" action={`/${locale}/platform/audit`} className="stack" style={{ gap: "0.6rem" }}>
          <span className="inline-field">
            <input
              id="audit-platform-only"
              type="checkbox"
              name="platformOnly"
              defaultChecked={platformOnly}
            />
            <label className="label" htmlFor="audit-platform-only">
              {d.platformAuditPlatformOnly}
            </label>
          </span>
          <div className="inline-field">
            <label className="label" htmlFor="audit-tenant-id">
              {d.platformAuditTenantFilter}
            </label>
            <input
              id="audit-tenant-id"
              className="input"
              type="text"
              name="tenantId"
              defaultValue={tenantId}
              maxLength={64}
            />
            <label className="label" htmlFor="audit-action">
              {d.platformAuditActionFilter}
            </label>
            <input
              id="audit-action"
              className="input"
              type="text"
              name="action"
              defaultValue={action}
              maxLength={200}
            />
            <button type="submit" className="btn btn-secondary">
              {d.platformAuditApply}
            </button>
          </div>
        </form>

        {events.data.length === 0 ? (
          <p className="muted">{d.platformAuditEmpty}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{d.platformAuditColAt}</th>
                  <th scope="col">{d.platformColTenant}</th>
                  <th scope="col">{d.platformAuditColAction}</th>
                  <th scope="col">{d.platformAuditColActor}</th>
                  <th scope="col">{d.platformAuditViaPlatform}</th>
                </tr>
              </thead>
              <tbody>
                {events.data.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.at, localeValue)}</td>
                    <td className="mono small">{event.tenantId ?? "—"}</td>
                    <td className="mono small">{event.action}</td>
                    <td className="mono small">{event.actorId ?? "—"}</td>
                    <td>
                      {event.viaPlatformAdmin ? (
                        <span className="badge badge-pending">{d.platformAuditViaPlatform}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nextCursor !== undefined && (
          <p>
            <a className="btn btn-secondary" href={`/${locale}/platform/audit?${nextLink.toString()}`}>
              {d.platformAuditNextPage}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="platform/audit" title={d.platformAuditTitle}>
      {content}
    </AppShell>
  );
}
