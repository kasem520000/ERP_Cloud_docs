# Navigation Model

> **Status:** STABLE · **Owner:** Design System Architecture · **Updated:** 2026-10-27

How users move through the platform: the information architecture, the entitlement-driven
navigation registry, the command menu as universal navigation, back/deep-link behavior,
role landing pages, mobile navigation, and the global keyboard shortcut registry. The app
shell (PHASE-005) implements this model; the
[configuration engine](../product/CONFIGURATION_ENGINE.md) consumes the same registry to
let industry templates re-order and re-label within the rules below.

## 1. Information architecture — top groups

Sidebar order is **binding** (start-to-end = top-to-bottom in LTR, right-to-left in RTL).
Arabic is canonical; English is full parity.

| # | Group (AR / EN) | Icon | Contains (examples) | Typical module |
|---|------------------|------|---------------------|----------------|
| 1 | الرئيسية / Home | home | Dashboard, approvals queue (if approver), reconciliation center | reporting, accounting |
| 2 | المبيعات / Sales | receipt | Quotations, sales orders, deliveries, invoices, credit notes, receipts, AR aging, statements | sales |
| 3 | المشتريات / Purchasing | truck | Purchase requests/orders, GRN, supplier invoices, debit notes, payments, AP aging | purchasing |
| 4 | المخزون / Inventory | boxes | Items & barcodes, stock on hand, movements, transfers, counts, batches/expiry, warehouses | inventory, items |
| 5 | المحاسبة / Accounting | ledger | Chart of accounts, journal entries, fiscal calendar & periods, trial balance & statements, period close | accounting |
| 6 | الخزينة / Treasury | banknote | Cash/bank accounts, receipts/disbursements, expenses, petty cash, transfers, cashier shifts, bank reconciliation | treasury |
| 7 | التقارير / Reports | bar-chart | Saved reports, all catalog reports, VAT returns, exports | reporting |
| 8 | الجهات / Partners | users | Customers, suppliers, credit terms, statements, balances | partners |
| 9 | الإعدادات / Settings | settings | Branches/warehouses, users & roles, tax codes, numbering, branding, subscription, industry template | tenancy, identity, tax |

Group visibility = entitlement AND at least one child visible (never an empty group).
Industry templates (PHASE-015) may add template-specific items (e.g., job cards under
المبيعات) but **may not reorder groups or remove core items** — configuration composes,
never forks ([../GLOSSARY.md](../GLOSSARY.md) Industry template).

## 2. Navigation registry (data model, normative)

Navigation is **data**, not code — a single registry resolved per session:

```ts
type NavItem = {
  id: string;                    // 'sales.invoices' — stable, used in shortcuts & deep links
  parentGroup: NavGroupId;       // one of the 9 groups above
  label: Bilingual;              // { ar: 'فواتير البيع', en: 'Sales invoices' }
  icon: LucideName;              // from the icon set, never custom SVGs per item
  route: string;                 // '/sales/invoices' — locale-agnostic; locale lives in URL prefix
  featureKey?: string;           // entitlement: 'sales.invoicing' — absent = core, always present
  permission?: string;           // minimum permission to see the item: 'sales.invoices.read'
  branchScoped: boolean;         // data is per-branch; UI shows branch switcher context
  archetype: ArchetypeId;        // which PAGE_ARCHETYPES layout the route uses
  shortcut?: string;             // global keyboard shortcut, e.g. 'j'
  order: number;                 // within group
};
```

**Resolution rule (server-side, binding):** an item renders iff
`entitlement(featureKey)` AND `permission(user, branch)` resolve true. The client never
decides visibility alone — routes without a matching grant return 404-equivalent (opaque),
not "forbidden lists" that leak feature existence
([../security/THREAT_MODEL.md](../security/THREAT_MODEL.md) discipline). Industry
templates may patch `label`, add items, or hide optional items via the configuration
engine; the registry stays the single source consumed by sidebar, command menu, mobile
tabs, and shortcuts.

## 3. Command menu — universal navigation (⌘K / Ctrl+K)

- Searches: navigation items (registry), recent documents (typed prefix `INV-`/`JE-`
  matches numbers), partners, items, and reports (by AR or EN label — both indexes).
- Fuzzy match; results grouped (تنقل / Navigation, تقارير / Reports, مستندات / Documents,
  جهات التعامل / Partners); arrow keys + Enter; `Escape` closes and restores focus.
- The command menu is the *only* global search surface — screens never add their own
  overlay search (in-view `SearchInput` remains for grid filtering).

## 4. Breadcrumbs, back behavior, and state preservation

- **Breadcrumbs** show the registry path (group → item → instance title); last crumb is
  plain text; middle crumbs preserve list context.
- **Back preserves filters**: list pages encode filter/sort/page/scroll state in the URL
  (`?status=POSTED&sort=-date&page=2`). Browser back and in-app back buttons restore the
  exact grid state; "record → back" must never dump the user on page 1.
- **Dirty-guard**: leaving an unsaved entry surface (archetypes 3/4/9) opens the cancel
  confirm dialog; autosaved drafts (transaction workspace) restore on return.
- **Deep links are first-class:** every list state, document, report run, and report
  parameter set is a shareable URL. Links are locale-prefixed (`/ar/...`, `/en/...`) and
  direction follows the prefix — sharing an AR link shows RTL regardless of viewer's
  preference.

## 5. Role-based landing pages

Landing page is a Dashboard archetype keyed by role and resolved at login
(PHASE-014; see [../product/USER_PERSONAS.md](../product/USER_PERSONAS.md)):

| Role (AR / EN) | Lands on | Rationale |
|----------------|----------|-----------|
| المحاسب / Accountant | Accounting dashboard: period status, TB snapshot, reconciliation tiles | Day starts with books health |
| الكاشير / Cashier (POS) | POS terminal (or shift open dialog) | Zero navigation friction |
| أمين المستودع / Warehouse keeper | Inventory dashboard: pending counts, transfers, low stock | Task-driven surface |
| صاحب المحل / Shop owner | Executive dashboard: cash, sales vs last period, receivables | Answers "how is business?" |
| مندوب المبيعات / Field rep | Mobile: today's route, van stock, customer balances | Field context |

Landing is user-overridable ("start here next time") but role-keyed defaults ship first.

## 6. Mobile navigation

Below `md` (768px) the shell collapses to:

- **Tab bar (bottom):** الرئيسية (Home) · المبيعات/الإجراءات (primary workflow of the
  role — one item) · التقارير (Reports) · المزيد (More → drawer with full registry).
  Tab bar respects the registry: the "primary workflow" slot is the highest-order
  visible item of the user's role.
- **Drawer:** full registry tree, swipe-reveal from the start edge + hamburger toggle;
  ≥44px rows; Escape and scrim close.
- Back-office pages below `lg` degrade to read-mostly ([PAGE_ARCHETYPES.md](PAGE_ARCHETYPES.md)
  preamble) — navigation never hides features that exist, but entry-heavy flows show an
  honest "best on desktop / يعمل أفضل على الحاسب" affordance instead of a broken grid.

## 7. Keyboard shortcut registry (global, normative)

| Shortcut | Action | Registry target |
|----------|--------|-----------------|
| `⌘K` / `Ctrl+K` | Command menu | global |
| `/` | Focus search of current view (or command menu if none) | global |
| `j` | New journal entry | `accounting.journal-entries.new` |
| `n` | New sales invoice | `sales.invoices.new` |
| `g` then `t` | Go to trial balance | `reports.trial-balance` |
| `g` then `h` | Go to dashboard | `home.dashboard` |
| `r` | Run/refresh current report or check | context |
| `?` | Shortcut cheat sheet (dialog) | global |
| `Ctrl+Enter` | Save & post / submit current entry surface | context |
| `Alt+Enter` | Add line (grid contexts) | context |

Rules: single-letter shortcuts are lowercase and never fire while typing in a field;
`g`-prefix is the "go" namespace; context shortcuts are documented on the archetype; all
shortcuts are discoverable via `?` and re-map-ready through the registry (never
hard-coded listeners in screens). POS terminal profiles define their own F-key map
(PHASE-016) layered on top.

## 8. Accessibility requirements (summary)

- Sidebar is a `nav` landmark with `aria-current="page"` on the active item; collapsed
  rail keeps accessible names ( tooltips); mobile drawer traps focus while open.
- Tab bar items are real links with visible text labels (icon + label, never icon-only).
- The active group/section is conveyed programmatically, not by color alone.
- Full contract: [ACCESSIBILITY.md](ACCESSIBILITY.md).

## 9. Phasing

| Capability | Phase |
|-----------|-------|
| App shell, sidebar, registry resolution, breadcrumbs, shortcuts (core set) | [PHASE-005](../planning/MASTER_ROADMAP.md) |
| Command menu with document/report search | PHASE-005 (nav) / PHASE-013 (reports index) |
| Mobile tab bar + drawer polish | PHASE-005 · validated with Android work in PHASE-022 |
| Industry template label/re-order patches | PHASE-015 |
| POS terminal nav profile | PHASE-016 |
| Role landing dashboards | PHASE-014 |
