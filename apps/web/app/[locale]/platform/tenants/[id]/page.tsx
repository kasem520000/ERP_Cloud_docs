/**
 * P4-T12a — /{locale}/platform/tenants/[id] (platform admin): tenant detail —
 * profile card, plan + change-plan form, entitlements (grant/revoke),
 * memberships table, branches list, suspend/restore panel (reason required)
 * and the support-session console (open/close + enumerated read-data views).
 * Cross-tenant reads happen server-side through the BFF's internal fetch;
 * every mutation goes through the BFF proxy from the client panels.
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../../../components/app-shell";
import { PlatformEntitlementsPanel } from "../../../../../components/platform-entitlements-panel";
import { PlatformLifecyclePanel } from "../../../../../components/platform-lifecycle-panel";
import { PlatformPlanForm } from "../../../../../components/platform-plan-form";
import { PlatformSupportConsole } from "../../../../../components/platform-support-console";
import { getDictionary, isLocale, type Locale } from "../../../../../i18n/dictionaries";
import type { ConsoleTenantDetail, SupportSessionRow } from "../../../../../lib/api-types";
import { formatDateTime, localizedApiError, localizedStatus, localizedName, statusClass } from "../../../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../../../lib/server-api";

export default async function PlatformTenantDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<JSX.Element> {
  const { locale, id } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const localeValue = locale as Locale;
  const d = getDictionary(localeValue);

  await requireSessionToken(localeValue);

  const detail = await fetchApi<ConsoleTenantDetail>(`platform/tenants/${id}`);
  if (!detail.ok && detail.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!detail.ok) {
    content =
      detail.status === 403 || detail.error.code === "FORBIDDEN" ? (
        <p className="alert alert-info" role="alert">
          {d.platformNoAccess}
        </p>
      ) : (
        <p className="alert alert-error" role="alert">
          {localizedApiError(d, detail.error, detail.retryAfterSeconds)}
        </p>
      );
  } else {
    const tenant = detail.data;
    const sessions = await fetchApi<readonly SupportSessionRow[]>(
      `platform/tenants/${id}/support-sessions`,
    );

    content = (
      <div className="stack">
        <p>
          <a href={`/${locale}/platform`}>{d.platformConsoleTitle}</a>
        </p>

        <section className="card" aria-label={d.platformProfileTitle}>
          <h2 style={{ marginBlockStart: 0 }}>{d.platformProfileTitle}</h2>
          <dl className="def-list">
            <div>
              <dt>{d.platformColTenant}</dt>
              <dd>
                {localizedName(tenant.name, tenant.nameAr, localeValue)}
                {tenant.isPlatformTenant && (
                  <>
                    {" "}
                    <span className="badge badge-pending">{d.platformTenantBadge}</span>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>{d.usersColStatus}</dt>
              <dd>
                <span className={`badge ${statusClass(tenant.status)}`}>
                  {localizedStatus(d, tenant.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt>{d.platformColCountry}</dt>
              <dd className="mono small">{tenant.countryCode}</dd>
            </div>
            <div>
              <dt>{d.registerCurrencyLabel}</dt>
              <dd className="mono small">{tenant.baseCurrency}</dd>
            </div>
            <div>
              <dt>{d.registerTemplateLabel}</dt>
              <dd className="mono small">{tenant.industryTemplateKey ?? "—"}</dd>
            </div>
            <div>
              <dt>{d.platformColCreated}</dt>
              <dd>{formatDateTime(tenant.createdAt, localeValue)}</dd>
            </div>
          </dl>
        </section>

        {!tenant.isPlatformTenant && (
          <section className="card" aria-label={d.platformLifecycleTitle}>
            <h2 style={{ marginBlockStart: 0 }}>{d.platformLifecycleTitle}</h2>
            <PlatformLifecyclePanel locale={localeValue} tenantId={tenant.id} status={tenant.status} />
          </section>
        )}

        <section className="card" aria-label={d.platformPlanTitle}>
          <h2 style={{ marginBlockStart: 0 }}>{d.platformPlanTitle}</h2>
          <dl className="def-list">
            <div>
              <dt>{d.platformPlanCurrentLabel}</dt>
              <dd>
                {tenant.plan === null
                  ? d.platformPlanNone
                  : `${localizedName(tenant.plan.name, tenant.plan.nameAr, localeValue)} (${tenant.plan.key})`}
              </dd>
            </div>
            {tenant.subscription !== null && (
              <div>
                <dt>{d.usersColStatus}</dt>
                <dd>
                  <span className={`badge ${statusClass(tenant.subscription.status)}`}>
                    {localizedStatus(d, tenant.subscription.status)}
                  </span>{" "}
                  <span className="muted small">
                    {formatDateTime(tenant.subscription.periodStart, localeValue)} →{" "}
                    {formatDateTime(tenant.subscription.periodEnd, localeValue)}
                  </span>
                </dd>
              </div>
            )}
          </dl>
          <div className="section-gap">
            <h3>{d.platformPlanAssignTitle}</h3>
            <PlatformPlanForm locale={localeValue} tenantId={tenant.id} currentPlanKey={tenant.plan?.key ?? null} />
          </div>
        </section>

        <PlatformEntitlementsPanel
          locale={localeValue}
          tenantId={tenant.id}
          entitlements={tenant.entitlements}
        />

        <section aria-label={d.platformMembershipsTitle}>
          <h2>{d.platformMembershipsTitle}</h2>
          {tenant.memberships.length === 0 ? (
            <p className="muted">{d.usersEmpty}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">{d.usersColEmail}</th>
                    <th scope="col">{d.usersColName}</th>
                    <th scope="col">{d.usersColRole}</th>
                    <th scope="col">{d.usersColStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.memberships.map((membership) => (
                    <tr key={membership.membershipId}>
                      <td>{membership.email}</td>
                      <td>{membership.fullName}</td>
                      <td className="mono small">{membership.roleKey}</td>
                      <td>
                        <span className={`badge ${statusClass(membership.membershipStatus)}`}>
                          {localizedStatus(d, membership.membershipStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label={d.platformBranchesTitle}>
          <h2>{d.platformBranchesTitle}</h2>
          {tenant.branches.length === 0 ? (
            <p className="muted">{d.branchesEmpty}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">{d.branchesColCode}</th>
                    <th scope="col">{d.branchesColName}</th>
                    <th scope="col">{d.branchesColNameAr}</th>
                    <th scope="col">{d.usersColStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.branches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="mono">{branch.code}</td>
                      <td>{branch.name}</td>
                      <td lang="ar">{branch.nameAr ?? "—"}</td>
                      <td>
                        <span className={`badge ${branch.isActive ? "badge-active" : "badge-expired"}`}>
                          {branch.isActive ? d.statusActive : d.statusInactive}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {sessions.ok ? (
          <PlatformSupportConsole
            locale={localeValue}
            tenantId={tenant.id}
            sessions={sessions.data}
          />
        ) : (
          sessions.status !== 403 && (
            <p className="alert alert-error" role="alert">
              {localizedApiError(d, sessions.error, sessions.retryAfterSeconds)}
            </p>
          )
        )}
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath={`platform/tenants/${id}`} title={d.platformConsoleTitle}>
      {content}
    </AppShell>
  );
}
