/**
 * /{locale}/roles — roles editor (identity.roles.assign plane): tenant
 * roles table + system templates table with clone buttons
 * (POST /api/bff/identity/roles/clone-template { templateKey }).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { CloneTemplateButton } from "../../../components/clone-template-button";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { RoleRow, RolesData } from "../../../lib/api-types";
import { localizedApiError, localizedName } from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

function RoleTable({
  d,
  locale,
  roles,
  withClone,
}: {
  d: ReturnType<typeof getDictionary>;
  locale: Locale;
  roles: readonly RoleRow[];
  withClone: boolean;
}): JSX.Element {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">{d.rolesColKey}</th>
            <th scope="col">{d.rolesColName}</th>
            <th scope="col">{d.rolesColSystem}</th>
            {withClone && <th scope="col">{d.rolesColActions}</th>}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id}>
              <td className="mono">{role.key}</td>
              <td>{localizedName(role.name, role.nameAr, locale)}</td>
              <td>{role.isSystem ? d.rolesYes : d.rolesNo}</td>
              {withClone && (
                <td>
                  <CloneTemplateButton locale={locale} templateKey={role.key} roleName={localizedName(role.name, role.nameAr, locale)} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function RolesPage({
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

  const roles = await fetchApi<RolesData>("identity/roles");
  if (!roles.ok && roles.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!roles.ok) {
    content = (
      <p className="alert alert-error" role="alert">
        {localizedApiError(d, roles.error, roles.retryAfterSeconds)}
      </p>
    );
  } else {
    content = (
      <div className="stack">
        <p className="muted" style={{ margin: 0 }}>
          {d.rolesDescription}
        </p>
        <section aria-label={d.rolesTenantTitle}>
          <h2>{d.rolesTenantTitle}</h2>
          <RoleTable d={d} locale={localeValue} roles={roles.data.tenantRoles} withClone={false} />
        </section>
        <section aria-label={d.rolesTemplatesTitle}>
          <h2>{d.rolesTemplatesTitle}</h2>
          <RoleTable d={d} locale={localeValue} roles={roles.data.systemTemplates} withClone={true} />
        </section>
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="roles" title={d.rolesTitle}>
      {content}
    </AppShell>
  );
}
