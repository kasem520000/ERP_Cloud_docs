/**
 * Authenticated shell: brand + admin nav + locale switch + logout, plus the
 * PHASE-003 footer note. `pagePath` is the page's own path segment ("" for
 * home) so the locale switch keeps the user on the same screen.
 *
 * P4-T12a (PHASE-004): the shell became an async server component — it reads
 * the current session once to decide whether the platform-operations nav
 * section (console + platform audit) must be revealed. On any session error
 * the nav simply degrades to the tenant-plane links (the pages themselves
 * still enforce 401/403).
 */
import type { JSX, ReactNode } from "react";

import { getDictionary, otherLocale, type Locale } from "../i18n/dictionaries";
import { PLATFORM_TENANT_ID } from "../lib/constants";
import type { CurrentSession } from "../lib/api-types";
import { fetchApi } from "../lib/server-api";
import { LogoutButton } from "./logout-button";

export async function AppShell({
  locale,
  pagePath,
  title,
  children,
}: {
  locale: Locale;
  pagePath: string;
  title: string;
  children: ReactNode;
}): Promise<JSX.Element> {
  const d = getDictionary(locale);
  const other = otherLocale(locale);
  const otherHref = `/${other}${pagePath === "" ? "" : `/${pagePath}`}`;

  const current = await fetchApi<CurrentSession>("identity/sessions/current");
  const showPlatformNav = current.ok && current.data.activeTenantId === PLATFORM_TENANT_ID;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href={`/${locale}`}>
            {d.appTitle}
          </a>
          <nav className="topnav" aria-label={d.appTitle}>
            <a href={`/${locale}`}>{d.navHome}</a>
            <a href={`/${locale}/users`}>{d.navUsers}</a>
            <a href={`/${locale}/sessions`}>{d.navSessions}</a>
            <a href={`/${locale}/mfa`}>{d.navMfa}</a>
            <a href={`/${locale}/roles`}>{d.navRoles}</a>
            <a href={`/${locale}/onboarding`}>{d.navOnboarding}</a>
            <a href={`/${locale}/branches`}>{d.navBranches}</a>
            <a href={`/${locale}/settings`}>{d.navSettings}</a>
            <a href={`/${locale}/settings/password`}>{d.navPassword}</a>
            <a href={`/${locale}/support-sessions`}>{d.navSupport}</a>
            {showPlatformNav && (
              <>
                <span className="nav-sep" aria-hidden="true" />
                <a href={`/${locale}/platform`} aria-label={d.navPlatformSection}>
                  {d.navPlatformConsole}
                </a>
                <a href={`/${locale}/platform/audit`}>{d.navPlatformAudit}</a>
              </>
            )}
          </nav>
          <div className="topbar-actions">
            <a lang={other} hrefLang={other} href={otherHref}>
              {d.switchLabel}
            </a>
            <LogoutButton locale={locale} label={d.signOut} />
          </div>
        </div>
      </header>
      <div className="container">
        <h1 lang={locale}>{title}</h1>
        {children}
      </div>
      <footer className="footer">
        <p>{d.phaseNote}</p>
      </footer>
    </>
  );
}
