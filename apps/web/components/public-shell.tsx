/**
 * Public (unauthenticated) shell for login / forgot-password /
 * accept-invitation: brand, locale switch, centered narrow column, footer.
 */
import type { JSX, ReactNode } from "react";

import { getDictionary, otherLocale, type Locale } from "../i18n/dictionaries";

export function PublicShell({
  locale,
  pagePath,
  title,
  children,
}: {
  locale: Locale;
  pagePath: string;
  title: string;
  children: ReactNode;
}): JSX.Element {
  const d = getDictionary(locale);
  const other = otherLocale(locale);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">{d.appTitle}</span>
          <div className="topbar-actions">
            <a lang={other} hrefLang={other} href={`/${other}/${pagePath}`}>
              {d.switchLabel}
            </a>
          </div>
        </div>
      </header>
      <div className="container container-narrow">
        <h1 lang={locale}>{title}</h1>
        {children}
      </div>
      <footer className="footer">
        <p>{d.phaseNote}</p>
      </footer>
    </>
  );
}
