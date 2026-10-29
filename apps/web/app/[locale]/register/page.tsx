/**
 * P4-T12a — /{locale}/register (public): the tenant self-registration screen.
 * Already signed in → home. The seeded form options (countries, currencies,
 * industry templates) load server-side through the BFF's internal fetch;
 * the client form posts to POST /api/bff/platform/register through the same
 * proxy (public route — no session, therefore no token/CSRF headers needed).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { PublicShell } from "../../../components/public-shell";
import { RegisterForm } from "../../../components/register-form";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { RegistrationOptions } from "../../../lib/api-types";
import { fetchApi, getSessionToken } from "../../../lib/server-api";

export default async function RegisterPage({
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

  const token = await getSessionToken();
  if (token !== undefined) {
    redirect(`/${locale}`);
  }

  const options = await fetchApi<RegistrationOptions>("platform/register/options");

  return (
    <PublicShell locale={localeValue} pagePath="register" title={d.registerTitle}>
      {options.ok ? (
        <RegisterForm locale={localeValue} options={options.data} />
      ) : (
        <p className="alert alert-error" role="alert">
          {d.registerErrorOptions}
        </p>
      )}
      <p className="auth-links">
        <span>{d.registerLoginPrompt}</span>
        <a href={`/${locale}/login`}>{d.registerGoLogin}</a>
      </p>
    </PublicShell>
  );
}
