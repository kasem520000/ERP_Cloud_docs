/**
 * /{locale}/forgot-password — public. The API always answers 200
 * {accepted:true} (no account enumeration, R-05); the screen shows the
 * same success message regardless of whether the email exists.
 */
import { notFound } from "next/navigation";
import type { JSX } from "react";

import { ForgotPasswordForm } from "../../../components/forgot-password-form";
import { PublicShell } from "../../../components/public-shell";
import { getDictionary, isLocale } from "../../../i18n/dictionaries";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<JSX.Element> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const d = getDictionary(locale);

  return (
    <PublicShell locale={locale} pagePath="forgot-password" title={d.forgotTitle}>
      <ForgotPasswordForm locale={locale} />
      <p className="auth-links">
        <a href={`/${locale}/login`}>{d.forgotBack}</a>
      </p>
    </PublicShell>
  );
}
