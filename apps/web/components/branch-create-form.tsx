"use client";

/**
 * P4-T12a — branch create form. POST /api/bff/tenancy/branches
 * { code, name, nameAr? }; 409 tenancy/branch-code-taken maps to the
 * localized duplicate-code message.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, JSX } from "react";

import { getDictionary, type Locale } from "../i18n/dictionaries";
import type { BranchRow } from "../lib/api-types";
import { bffFetch } from "../lib/client-api";
import { localizedTenancyError } from "../lib/messages";

export function BranchCreateForm({ locale }: { locale: Locale }): JSX.Element {
  const d = getDictionary(locale);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    if (code.trim() === "" || name.trim() === "") {
      setError(d.errorsValidation);
      return;
    }
    const body: Record<string, unknown> = { code: code.trim(), name: name.trim() };
    if (nameAr.trim() !== "") {
      body.nameAr = nameAr.trim();
    }
    setBusy(true);
    const result = await bffFetch<BranchRow>("tenancy/branches", { method: "POST", body });
    setBusy(false);
    if (!result.ok) {
      setError(localizedTenancyError(d, result.error, result.retryAfterSeconds));
      return;
    }
    setCode("");
    setName("");
    setNameAr("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label className="label" htmlFor="branch-code">
          {d.branchesCodeLabel}
        </label>
        <input
          id="branch-code"
          className="input"
          type="text"
          name="code"
          required
          maxLength={20}
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="branch-name">
          {d.branchesNameLabel}
        </label>
        <input
          id="branch-name"
          className="input"
          type="text"
          name="name"
          required
          maxLength={200}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="branch-name-ar">
          {d.branchesNameArLabel}
        </label>
        <input
          id="branch-name-ar"
          className="input"
          type="text"
          name="nameAr"
          dir="rtl"
          maxLength={200}
          value={nameAr}
          onChange={(event) => {
            setNameAr(event.target.value);
          }}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? d.loading : d.branchesCreateSubmit}
        </button>
      </div>
      {error !== null && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
