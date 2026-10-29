/**
 * P4-T12a — /{locale}/platform (platform admin console): tenant list + q
 * search (GET /api/bff/platform/tenants?limit=200 through the BFF's internal
 * fetch). Non-platform sessions get the localized "platform administration
 * area" notice (the API 403s + audits every escalation attempt — S-07). Row
 * names link to the tenant detail screen.
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { ConsoleTenantSummary } from "../../../lib/api-types";
import { formatDateTime, localizedApiError, localizedStatus, localizedName, statusClass } from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

export default async function PlatformPage({
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
  const rawQuery = query.q;
  const search = typeof rawQuery === "string" ? rawQuery.trim() : "";

  const path = `platform/tenants?limit=200${search === "" ? "" : `&q=${encodeURIComponent(search)}`}`;
  const tenants = await fetchApi<readonly ConsoleTenantSummary[]>(path);
  if (!tenants.ok && tenants.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!tenants.ok) {
    content =
      tenants.status === 403 || tenants.error.code === "FORBIDDEN" ? (
        <p className="alert alert-info" role="alert">
          {d.platformNoAccess}
        </p>
      ) : (
        <p className="alert alert-error" role="alert">
          {localizedApiError(d, tenants.error, tenants.retryAfterSeconds)}
        </p>
      );
  } else {
    content = (
      <div className="stack">
        <form method="get" action={`/${locale}/platform`} className="inline-field" role="search">
          <label className="label" htmlFor="platform-q">
            {d.platformSearchLabel}
          </label>
          <input
            id="platform-q"
            className="input"
            type="search"
            name="q"
            defaultValue={search}
            maxLength={200}
          />
          <button type="submit" className="btn btn-secondary">
            {d.platformSearchSubmit}
          </button>
        </form>

        {tenants.data.length === 0 ? (
          <p className="muted">{d.platformEmpty}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{d.platformColTenant}</th>
                  <th scope="col">{d.platformColCountry}</th>
                  <th scope="col">{d.usersColStatus}</th>
                  <th scope="col">{d.platformColCreated}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.data.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <a href={`/${locale}/platform/tenants/${tenant.id}`}>
                        {localizedName(tenant.name, tenant.nameAr, localeValue)}
                      </a>{" "}
                      {tenant.isPlatformTenant && (
                        <span className="badge badge-pending">{d.platformTenantBadge}</span>
                      )}
                    </td>
                    <td className="mono small">{tenant.countryCode}</td>
                    <td>
                      <span className={`badge ${statusClass(tenant.status)}`}>
                        {localizedStatus(d, tenant.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(tenant.createdAt, localeValue)}</td>
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
    <AppShell locale={localeValue} pagePath="platform" title={d.platformConsoleTitle}>
      {content}
    </AppShell>
  );
}
