/**
 * P4-T12a — /{locale}/settings (session, tenancy.settings.manage): the owner
 * console — profile card (name/nameAr/timezone via PUT tenancy/profile) plus
 * the typed settings cards (one PUT tenancy/settings/:key per field with
 * per-field saved/error feedback in the client component).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { ProfileForm } from "../../../components/profile-form";
import { TenantSettingsForm } from "../../../components/tenant-settings-form";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { TenantProfile, TenantSettingsMap } from "../../../lib/api-types";
import { localizedApiError } from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

export default async function SettingsPage({
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

  const [profile, settings] = await Promise.all([
    fetchApi<TenantProfile>("tenancy/profile"),
    fetchApi<TenantSettingsMap>("tenancy/settings"),
  ]);
  if (
    (!profile.ok && profile.status === 401) ||
    (!settings.ok && settings.status === 401)
  ) {
    redirect(`/${locale}/login`);
  }

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
  } else {
    content = (
      <div className="stack">
        <section className="card" style={{ maxWidth: "30rem" }} aria-label={d.settingsProfileTitle}>
          <h2 style={{ marginBlockStart: 0 }}>{d.settingsProfileTitle}</h2>
          <ProfileForm
            locale={localeValue}
            initial={{ name: profile.data.name, nameAr: profile.data.nameAr, timezone: profile.data.timezone }}
          />
        </section>
        {settings.ok ? (
          <TenantSettingsForm locale={localeValue} settings={settings.data} />
        ) : (
          settings.status !== 403 && (
            <p className="alert alert-error" role="alert">
              {localizedApiError(d, settings.error, settings.retryAfterSeconds)}
            </p>
          )
        )}
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="settings" title={d.settingsTitle}>
      {content}
    </AppShell>
  );
}
