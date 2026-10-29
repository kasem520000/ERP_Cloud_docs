/**
 * Landing dashboard (replaces the PHASE-001 demo). No session cookie →
 * login. With a session: current user, active tenant + switcher, granted
 * permission count and links to the PHASE-003 admin screens. The PHASE-001
 * demo survives only as the footer phase note.
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../components/app-shell";
import { TenantSwitcher, type TenantOption } from "../../components/tenant-switcher";
import { getDictionary, isLocale, type Locale } from "../../i18n/dictionaries";
import type { CurrentSession } from "../../lib/api-types";
import { localizedApiError, localizedStatus, localizedName, formatMessage } from "../../lib/messages";
import { fetchApi, getSessionToken } from "../../lib/server-api";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const d = getDictionary(locale as Locale);

  const token = await getSessionToken();
  if (token === undefined) {
    redirect(`/${locale}/login`);
  }

  const current = await fetchApi<CurrentSession>("identity/sessions/current");
  if (!current.ok) {
    if (current.status === 401) {
      redirect(`/${locale}/login`);
    }
    return (
      <AppShell locale={locale as Locale} pagePath="" title={d.appTitle}>
        <p className="alert alert-error" role="alert">
          {localizedApiError(d, current.error, current.retryAfterSeconds)}
        </p>
      </AppShell>
    );
  }

  const session = current.data;
  const activeMembership = session.memberships.find(
    (membership) => membership.tenantId === session.activeTenantId,
  );
  const options: TenantOption[] = session.memberships.map((membership) => ({
    tenantId: membership.tenantId,
    label: localizedName(membership.tenantName, membership.tenantNameAr, locale as Locale),
    switchable: membership.membershipStatus === "ACTIVE" && membership.tenantStatus === "ACTIVE",
    isActive: membership.tenantId === session.activeTenantId,
    statusText: localizedStatus(d, membership.membershipStatus),
  }));

  const displayName = session.user.fullName === "" ? session.user.email : session.user.fullName;
  const roleKey = activeMembership?.roleKey ?? "—";

  return (
    <AppShell locale={locale as Locale} pagePath="" title={formatMessage(d.homeWelcome, { name: displayName })}>
      <div className="stack">
        <p className="muted">{session.user.email}</p>

        <section className="card" aria-label={d.homeTenantLabel}>
          <dl className="def-list">
            <div>
              <dt>{d.homeTenantLabel}</dt>
              <dd>
                {activeMembership === undefined
                  ? "—"
                  : localizedName(activeMembership.tenantName, activeMembership.tenantNameAr, locale as Locale)}
              </dd>
            </div>
            <div>
              <dt>{d.homeRoleLabel}</dt>
              <dd className="mono">{roleKey}</dd>
            </div>
          </dl>
          <p className="muted" style={{ marginBlockStart: "0.9rem" }}>
            {formatMessage(d.homePermissionsLabel, { count: session.permissions.length })}
          </p>
        </section>

        <section>
          <h2>{d.homeSwitchTenant}</h2>
          <TenantSwitcher locale={locale as Locale} options={options} activeTenantId={session.activeTenantId} />
        </section>

        <section>
          <h2>{d.homeScreens}</h2>
          <div className="tiles">
            <a className="tile" href={`/${locale}/users`}>
              {d.navUsers}
            </a>
            <a className="tile" href={`/${locale}/sessions`}>
              {d.navSessions}
            </a>
            <a className="tile" href={`/${locale}/mfa`}>
              {d.navMfa}
            </a>
            <a className="tile" href={`/${locale}/roles`}>
              {d.navRoles}
            </a>
            <a className="tile" href={`/${locale}/settings/password`}>
              {d.navPassword}
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
