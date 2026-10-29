/**
 * /{locale}/users — tenant users + invitations + invite form (requires
 * identity.users.view; 403 → "no permission" message). Data flows through
 * the BFF's internal fetch; all mutations go through the BFF proxy with
 * the CSRF echo handled by the client wrapper.
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { InviteForm } from "../../../components/invite-form";
import { RevokeInvitationButton } from "../../../components/revoke-invitation-button";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { InvitationView, RolesData, TenantUserRow } from "../../../lib/api-types";
import {
  formatDateTime,
  localizedApiError,
  localizedStatus,
  localizedName,
  statusClass,
} from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

export default async function UsersPage({
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

  const users = await fetchApi<readonly TenantUserRow[]>("identity/users");
  if (!users.ok && users.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!users.ok) {
    const message =
      users.status === 403 || users.error.code === "FORBIDDEN"
        ? d.usersNoPermission
        : localizedApiError(d, users.error, users.retryAfterSeconds);
    content = (
      <p className="alert alert-error" role="alert">
        {message}
      </p>
    );
  } else {
    const [invitations, roles] = await Promise.all([
      fetchApi<readonly InvitationView[]>("identity/invitations"),
      fetchApi<RolesData>("identity/roles"),
    ]);

    content = (
      <div className="stack">
        <section aria-label={d.usersTitle}>
          <h2>{d.usersTitle}</h2>
          {users.data.length === 0 ? (
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
                    <th scope="col">{d.usersColLastLogin}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((user) => (
                    <tr key={user.membershipId}>
                      <td>{user.email}</td>
                      <td>{user.fullName}</td>
                      <td>
                        {localizedName(user.roleName, user.roleNameAr, localeValue)}{" "}
                        <span className="mono muted">({user.roleKey})</span>
                      </td>
                      <td>
                        <span className={`badge ${statusClass(user.status)}`}>
                          {localizedStatus(d, user.status)}
                        </span>
                      </td>
                      <td>{user.lastLoginAt === null ? d.usersNever : formatDateTime(user.lastLoginAt, localeValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {roles.ok ? (
          <section className="card" aria-label={d.usersInviteTitle}>
            <h2 style={{ marginBlockStart: 0 }}>{d.usersInviteTitle}</h2>
            <InviteForm
              locale={localeValue}
              roles={roles.data.tenantRoles.map((role) => ({
                id: role.id,
                label: localizedName(role.name, role.nameAr, localeValue),
                key: role.key,
              }))}
            />
          </section>
        ) : (
          roles.status !== 403 && (
            <p className="alert alert-error" role="alert">
              {localizedApiError(d, roles.error, roles.retryAfterSeconds)}
            </p>
          )
        )}

        <section aria-label={d.usersInvitationsTitle}>
          <h2>{d.usersInvitationsTitle}</h2>
          {!invitations.ok ? (
            invitations.status !== 403 && (
              <p className="alert alert-error" role="alert">
                {localizedApiError(d, invitations.error, invitations.retryAfterSeconds)}
              </p>
            )
          ) : invitations.data.length === 0 ? (
            <p className="muted">{d.usersEmptyInvitations}</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">{d.usersColEmail}</th>
                    <th scope="col">{d.usersColRole}</th>
                    <th scope="col">{d.usersColStatus}</th>
                    <th scope="col">{d.usersColExpires}</th>
                    <th scope="col">{d.usersColActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.data.map((invitation) => (
                    <tr key={invitation.invitationId}>
                      <td>{invitation.email}</td>
                      <td>
                        {localizedName(invitation.roleName, invitation.roleNameAr, localeValue)}{" "}
                        <span className="mono muted">({invitation.roleKey})</span>
                      </td>
                      <td>
                        <span className={`badge ${statusClass(invitation.status)}`}>
                          {localizedStatus(d, invitation.status)}
                        </span>
                      </td>
                      <td>{formatDateTime(invitation.expiresAt, localeValue)}</td>
                      <td>
                        <RevokeInvitationButton
                          locale={localeValue}
                          invitationId={invitation.invitationId}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="users" title={d.usersTitle}>
      {content}
    </AppShell>
  );
}
