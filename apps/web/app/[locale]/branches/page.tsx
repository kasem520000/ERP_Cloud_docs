/**
 * P4-T12a — /{locale}/branches (session, tenancy.branches.manage): branch
 * list with active badges, the create form and per-row activate/deactivate
 * toggles. Data loads through the BFF's internal fetch; mutations go through
 * the BFF proxy from the client components (CSRF double-submit handled by
 * the client wrapper).
 */
import { notFound, redirect } from "next/navigation";
import type { JSX } from "react";

import { AppShell } from "../../../components/app-shell";
import { BranchCreateForm } from "../../../components/branch-create-form";
import { BranchToggleButton } from "../../../components/branch-toggle-button";
import { getDictionary, isLocale, type Locale } from "../../../i18n/dictionaries";
import type { BranchRow } from "../../../lib/api-types";
import { localizedApiError } from "../../../lib/messages";
import { fetchApi, requireSessionToken } from "../../../lib/server-api";

export default async function BranchesPage({
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

  const branches = await fetchApi<readonly BranchRow[]>("tenancy/branches");
  if (!branches.ok && branches.status === 401) {
    redirect(`/${locale}/login`);
  }

  let content: JSX.Element;
  if (!branches.ok) {
    content =
      branches.status === 403 || branches.error.code === "FORBIDDEN" ? (
        <p className="alert alert-error" role="alert">
          {d.errorsForbidden}
        </p>
      ) : (
        <p className="alert alert-error" role="alert">
          {localizedApiError(d, branches.error, branches.retryAfterSeconds)}
        </p>
      );
  } else {
    content = (
      <div className="stack">
        <section aria-label={d.branchesTitle}>
          <h2>{d.branchesTitle}</h2>
          {branches.data.length === 0 ? (
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
                    <th scope="col">{d.usersColActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.data.map((branch) => (
                    <tr key={branch.id}>
                      <td className="mono">{branch.code}</td>
                      <td>{branch.name}</td>
                      <td lang="ar">{branch.nameAr ?? "—"}</td>
                      <td>
                        <span className={`badge ${branch.isActive ? "badge-active" : "badge-expired"}`}>
                          {branch.isActive ? d.statusActive : d.statusInactive}
                        </span>
                      </td>
                      <td>
                        <BranchToggleButton
                          locale={localeValue}
                          branchId={branch.id}
                          isActive={branch.isActive}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card" style={{ maxWidth: "26rem" }} aria-label={d.branchesCreateTitle}>
          <h2 style={{ marginBlockStart: 0 }}>{d.branchesCreateTitle}</h2>
          <BranchCreateForm locale={localeValue} />
        </section>
      </div>
    );
  }

  return (
    <AppShell locale={localeValue} pagePath="branches" title={d.branchesTitle}>
      {content}
    </AppShell>
  );
}
