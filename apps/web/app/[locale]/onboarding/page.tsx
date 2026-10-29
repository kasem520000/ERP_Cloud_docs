/**
 * P4-T12a — /{locale}/onboarding (session): the two-step workspace wizard.
 * The server pre-checks the session (401 → login) and — since every member
 * may read the derived entitlements payload — hides the wizard with a
 * feature notice when `platform.onboarding` is not granted. The wizard itself
 * posts to POST /api/bff/tenancy/onboarding/provision (feature-gated route).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { OnboardingWizard } from "../../../components/onboarding-wizard";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import { ONBOARDING_FEATURE_KEY } from "../../../lib/constants";
import type { DerivedEntitlements, TenantProfile } from "../../../lib/api-types";
import { localizedApiError } from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

export default async function OnboardingPage({
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

  // The provision route needs tenancy.settings.manage — the same permission
  // as the profile read, so a profile 401/403 decides access up front.
  const profile = await fetchApi<TenantProfile>("tenancy/profile");
  if (!profile.ok && profile.status === 401) {
    redirect(`/${locale}/login`);
  }

  const entitlements = await fetchApi<DerivedEntitlements>("tenancy/entitlements");
  const canProvision = !entitlements.ok || entitlements.data.featureKeys.includes(ONBOARDING_FEATURE_KEY);

  let content: JSX.Element;
  if (!profile.ok) {
    content =
      profile.status === 403 || profile.error.code === "FORBIDDEN" ? (
        <p className="alert alert-error" role="alert">
          {d.errorsForbidden}
        </p>
      ) : (
        <p className="alert alert-error" role="alert">
          {localizedApiError(d, profile.error, profile.retryAfterSeconds)}
        </p>
      );
  } else if (!canProvision) {
    content = (
      <p className="alert alert-info" role="alert">
        {d.tenancyErrorFeatureNotEntitled}
      </p>
    );
  } else {
    content = <OnboardingWizard locale={localeValue} />;
  }

  return (
    <AppShell locale={localeValue} pagePath="onboarding" title={d.onboardingTitle}>
      {content}
    </AppShell>
  );
}
