# Industry Catalog

> **Status:** STABLE · **Owner:** Product & Platform Architecture · **Updated:** 2026-10-28 — EXP-001 (+6 verticals for giant parity)

The eight launch industry templates. A template is a **versioned manifest** (see
[CONFIGURATION_ENGINE.md](CONFIGURATION_ENGINE.md) and the `industry_templates` entity in
[../database/ENTITY_CATALOG.md](../database/ENTITY_CATALOG.md)) that layers terminology,
menu emphasis, workflow defaults, and report packs onto the same financial core — never a
fork. Manifest files live under [../industries/templates/](../industries/templates/)
(each template below links its embedded manifest document and the extracted
machine-readable JSON under [../industries/templates/manifests/](../industries/templates/manifests/)),
with capability mapping in [../industries/capabilities/](../industries/capabilities/)
and industry workflows in [../industries/workflows/](../industries/workflows/).

**Template IDs** use `industry.<key>` (naming rule §5 of
[FEATURE_CATALOG.md](FEATURE_CATALOG.md)). They are configuration artifacts: plans grant the
*feature keys* a template emphasizes (see [SUBSCRIPTION_AND_ENTITLEMENTS.md](SUBSCRIPTION_AND_ENTITLEMENTS.md)
§4 add-ons), and the template decides how those features present.

## Summary matrix

| Template ID | Template (EN · AR) | Phase | Core emphasis | Flagship features |
|---|---|---|---|---|
| `industry.retail` | Retail · التجزئة | 015 | Counter selling, barcode, cash discipline | `pos.*`, `items.barcodes`, `treasury.cashier_shifts` |
| `industry.grocery` | Grocery / supermarket · البقالات والسوبرماركت | 015 | Volume retail, expiry, weighted goods | `pos.*`, `inventory.batch_tracking`, `items.units_of_measure` |
| `industry.restaurant` | Restaurant / café · المطاعم والمقاهي | 015 | Fast POS, daily cash, expiry waste | `pos.*`, `inventory.batch_tracking`, `treasury.cashier_shifts` |
| `industry.automotive` | Automotive / workshop · السيارات والورش | 017 | Parts + service job cards, seriality | `crm.service_orders`, `inventory.serial_tracking`, `manufacturing.qc` (recheck) |
| `industry.distribution` | Distribution / field sales · التوزيع والمبيعات الميدانية | 017 | Van stock, credit routes, settlements | `distribution.*`, `sales.credit_limits`, `offline.android_app` |
| `industry.food_manufacturing` | Food manufacturing · التصنيع الغذائي | 018 | BOM, batches, genealogy, expiry, QC | `manufacturing.*`, `inventory.batch_tracking` |
| `industry.professional_services` | Professional services · الخدمات المهنية | 019 | Contracts, recurring billing, projects | `crm.*`, `accounting.projects`, `accounting.cost_centers` |
| `industry.rental_logistics` | Rental / logistics · التأجير والخدمات اللوجستية | 019 | Contracts, deposits, item availability | `crm.service_contracts`, `items.item_master`, `inventory.stock_ledger` |
| `industry.wholesale` | Wholesale · تجارة الجملة | 029 | Tier/bulk pricing, credit wholesale | `wholesale.*`, `sales.credit_limits` |
| `industry.electronics_mobile` | Electronics & mobiles · الإلكترونيات والجوالات | 030 | Serial/IMEI, warranty, RMA, repair | `electronics.*`, `inventory.serial_tracking` |
| `industry.healthcare` | Healthcare · الرعاية الصحية | 031 | Clinic/HIS lite, patients, billing | `healthcare.*`, `sales.invoices` |
| `industry.education` | Education · التعليم | 032 | SIS lite, fees, timetable | `education.*`, `sales.invoices` |
| `industry.agriculture` | Agriculture · الزراعة والثروة الحيوانية | 033 | Farms, crops, livestock, harvest | `agriculture.*`, `inventory.*` |

## 9. `industry.wholesale` — Wholesale · تجارة الجملة (PHASE-029)

- **Target:** تجار جملة بآلاف الأصناف، تسعير شرائح حسب الكمية، خصومات حجم، آجل مجدول
- **Emphasis:** `wholesale.tier_pricing`, `sales.credit_limits`, `distribution` settlements
- **Workflows:** طلب جملة → تسعير شريحة → تخصيص ائتماني → تسليم بسيارة → تحصيل مجدول

## 10. `industry.electronics_mobile` — Electronics & Mobiles · الإلكترونيات والجوالات (PHASE-030)

- **Target:** محلات جوالات/إلكترونيات مع ضمان وسيريال/IMEI وصيانة
- **Emphasis:** `electronics.warranty`, `inventory.serial_tracking`, `repair_tickets`, `rma_claims`
- **Workflows:** بيع بضمان → تتبع IMEI → بلاغ عطل → تذكرة صيانة → استهلاك قطع غيار → فاتورة صيانة

## 11. `industry.healthcare` — Healthcare · الرعاية الصحية (PHASE-031) — HIS Lite

- **Target:** عيادات/مستوصفات صغيرة-متوسطة (ليس مستشفى جامعي)
- **Emphasis:** `healthcare.patients`, appointments, encounters, `medical_invoices` linked to sales
- **Note:** سجل طبي مبسط + فوترة تأمينية + ربط صيدلية (استهلاك مخزون) — مطابقة HL7/FHIR مؤجلة لما بعد 034

## 12. `industry.education` — Education · التعليم (PHASE-032) — SIS Lite

- **Target:** مدارس أهلية/معاهد تدريب
- **Emphasis:** `education.students`, `classes`, `enrollments`, `fee_structures`, `fee_invoices`
- **Workflows:** تسجيل طالب → إسناد شعبة → توليد رسوم فصلية → فاتورة رسوم → تحصيل → كشف درجات

## 13. `industry.agriculture` — Agriculture & Livestock · الزراعة والثروة الحيوانية (PHASE-033)

- **Target:** مزارع نباتية/حيوانية
- **Emphasis:** `farms`, `crop_seasons`, `harvests`, `livestock`, feed/harvest to inventory
- **Workflows:** موسم زراعي → مدخلات (بذور/أسمدة كمصروف مخزني) → حصاد → توريد لمستودع → تقييم مخزون محصول


## 1. `industry.retail` — Retail · قالب التجزئة

- **Target businesses.** Single- or few-branch shops selling physical goods over a counter:
  mobile accessories, electronics, clothing, pharmacies, bookstores. Persona P-01 (owner)
  and P-04 (cashier).
- **Capability needs.** Barcode-first selling, cash/card split, simple returns, reorder
  visibility, daily cash discipline; minimal accounting vocabulary.
- **Key modules emphasized.** `pos`, `items` (barcodes, price lists), `inventory`
  (multi-warehouse basics), `treasury` (shifts), `reporting` (daily cash, sales by item).
- **Example workflows.** [BUSINESS_WORKFLOWS.md](BUSINESS_WORKFLOWS.md) §1 (cash O2C), §4
  (counts), §9 (bank rec); [USER_JOURNEYS.md](USER_JOURNEYS.md) Journey B.
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/retail.md](../industries/templates/retail.md) (embedded) and
  [../industries/templates/manifests/manifest.retail.json](../industries/templates/manifests/manifest.retail.json) (extracted machine form, id `industry.retail`).
- **Terminology examples.** نسمي الشاشة الرئيسية "المبيعات" لا "المستندات"; invoice kinds
  surface as "فاتورة نقدي/آجل" instead of CASH/CREDIT codes.

## 2. `industry.grocery` — Grocery / supermarket · قالب البقالات والسوبرماركت

- **Target businesses.** Supermarkets and groceries with hundreds to tens of thousands of
  SKUs, weighted goods (produce, meat), high expiry turnover.
- **Capability needs.** Fast item lookup by barcode/partial name, scale-barcode parsing,
  FEFO picking, expiry write-off workflow, promotions (multi-price), tight count cycles.
- **Key modules emphasized.** `pos` (scale integration via barcode parsing), `items`
  (categories, UoM, price lists), `inventory` (batches/expiry), `reporting` (expiry report,
  margin by category).
- **Example workflows.** Workflow §1 (POS), §4 (rolling counts on categories), expiry
  write-off per [../accounting/INVENTORY_ACCOUNTING.md](../accounting/INVENTORY_ACCOUNTING.md) §5.
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/grocery-supermarket.md](../industries/templates/grocery-supermarket.md) (embedded) and
  [../industries/templates/manifests/manifest.grocery.json](../industries/templates/manifests/manifest.grocery.json) (extracted machine form, id `industry.grocery`).

## 3. `industry.restaurant` — Restaurant / café · قالب المطاعم والمقاهي

- **Target businesses.** Restaurants, cafés, bakeries, buffets: high ticket volume, small
  item count, daily stock of perishables, cash + card mix.
- **Capability needs.** Sub-second POS, order/shift handover, purchase by recipe
  (kitchen-level BOM lite), waste/expiry recording, daily cash close.
- **Key modules emphasized.** `pos`, `inventory.batch_tracking`, `treasury.cashier_shifts`,
  `items.composite_products` (combo meals), `purchasing` (supplier invoices with weight
  capture).
- **Example workflows.** Workflow §1, §9; Journey B; production-lite via composites (full
  production belongs to `industry.food_manufacturing`).
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/restaurant-cafe.md](../industries/templates/restaurant-cafe.md) (embedded) and
  [../industries/templates/manifests/manifest.restaurant.json](../industries/templates/manifests/manifest.restaurant.json) (extracted machine form, id `industry.restaurant`).

## 4. `industry.automotive` — Automotive / workshop · قالب السيارات والورش

- **Target businesses.** Tire shops, spare-parts dealers, repair workshops, service centers
  — frequently parts + labor in one invoice (PHASE-017, per
  [../planning/MASTER_ROADMAP.md](../planning/MASTER_ROADMAP.md)).
- **Capability needs.** Job cards (service orders) consuming parts and labor, serial/IMEI
  where applicable, per-vehicle service history, supplier special-order flows.
- **Key modules emphasized.** `crm.service_orders`, `inventory.serial_tracking`,
  `items.item_master` (fitment attributes via categories), `purchasing`, `accounting.cost_centers`
  (per-bay profitability).
- **Example workflows.** Job-card: service order → parts issue → labor lines → invoice
  (variant of Workflow §2 with service lines); Workflow §8 feeding maintenance contracts.
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/automotive-workshop.md](../industries/templates/automotive-workshop.md) (embedded) and
  [../industries/templates/manifests/manifest.automotive.json](../industries/templates/manifests/manifest.automotive.json) (extracted machine form, id `industry.automotive`).

## 5. `industry.distribution` — Distribution / field sales · قالب التوزيع

- **Target businesses.** Beverage/snack/household distributors with van fleets, credit
  routes, and rep commissions (PHASE-017).
- **Capability needs.** Van stock accountability, route planning, offline selling and
  collecting, free-goods promotions, settlements, customer tiers, credit discipline at
  scale.
- **Key modules emphasized.** `distribution.*` (routes, van stock, settlements, tiers, free
  goods), `sales` (credit limits, reps, commissions), `offline.android_app`, `treasury`
  (collections).
- **Example workflows.** Workflow §7 (van-sales settlement); [USER_JOURNEYS.md](USER_JOURNEYS.md)
  Journey G.
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/distribution-field-sales.md](../industries/templates/distribution-field-sales.md) (embedded) and
  [../industries/templates/manifests/manifest.distribution.json](../industries/templates/manifests/manifest.distribution.json) (extracted machine form, id `industry.distribution`).

## 6. `industry.food_manufacturing` — Food manufacturing · قالب التصنيع الغذائي

- **Target businesses.** Bakeries, dairy, packaged-food producers — BOM-driven production
  with batch traceability and expiry (PHASE-018).
- **Capability needs.** BOM versioning, production orders with WIP costing, batch
  genealogy for recall, expiry management, QC intake checks, scrap/waste posting.
- **Key modules emphasized.** `manufacturing.*` (BOM, production orders, WIP, costing,
  scrap, genealogy, QC), `inventory.batch_tracking`, `purchasing.landed_costs`.
- **Example workflows.** Workflow §6 (production run); batch genealogy from consumed to
  produced batches; expiry write-off.
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/food-manufacturing.md](../industries/templates/food-manufacturing.md) (embedded) and
  [../industries/templates/manifests/manifest.food_manufacturing.json](../industries/templates/manifests/manifest.food_manufacturing.json) (extracted machine form, id `industry.food_manufacturing`).

## 7. `industry.professional_services` — Professional services · قالب الخدمات المهنية

- **Target businesses.** Law offices, engineering consultants, marketing agencies,
  maintenance contractors — selling time and recurring service (PHASE-019).
- **Capability needs.** Contracts with billing schedules, recurring invoices, project/cost-
  center profitability, service orders for deliverables, minimal stock (consumables).
- **Key modules emphasized.** `crm.*` (contracts, recurring billing, service orders),
  `accounting.projects`, `accounting.cost_centers`, `sales.invoices` (time/expense lines).
- **Example workflows.** Workflow §8 (service contract billing); expense claims (Journey F)
  tagged to projects.
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/professional-services.md](../industries/templates/professional-services.md) (embedded) and
  [../industries/templates/manifests/manifest.professional_services.json](../industries/templates/manifests/manifest.professional_services.json) (extracted machine form, id `industry.professional_services`).

## 8. `industry.rental_logistics` — Rental / logistics · قالب التأجير واللوجستيات

- **Target businesses.** Car/equipment rental, freight agencies, storage providers —
  contracts, deposits, and availability-driven operations (PHASE-019; framework available
  from PHASE-015).
- **Capability needs.** Rental contracts with periodic billing and return workflows,
  deposit handling, asset-level availability (serials), shipment/consignment tracking
  basics.
- **Key modules emphasized.** `crm.service_contracts` (rental terms), `crm.recurring_billing`,
  `inventory.serial_tracking` (asset units), `treasury` (deposit handling via on-account
  amounts, BR-027), `items.item_master` (rental SKUs with own UoM semantics).
- **Example workflows.** Workflow §8 (contract billing) + return/inspection variant of
  Workflow §4 (condition counts); deposit apply against final invoice.
- **Manifest pointer.** [../industries/templates/](../industries/templates/) — actual manifest at
  [../industries/templates/rental-logistics.md](../industries/templates/rental-logistics.md) (embedded) and
  [../industries/templates/manifests/manifest.rental_logistics.json](../industries/templates/manifests/manifest.rental_logistics.json) (extracted machine form, id `industry.rental_logistics`).

## How templates relate to the rest of the blueprint

1. **A template never changes accounting** — it re-uses the identical posting engine and
   invariants (INV-022). It selects defaults (policies from [BUSINESS_RULES.md](BUSINESS_RULES.md)),
   menu emphasis, terminology (Arabic-first), and report packs.
2. **A template never grants features by itself** — entitlements come from the plan and
   add-ons ([SUBSCRIPTION_AND_ENTITLEMENTS.md](SUBSCRIPTION_AND_ENTITLEMENTS.md)); a
   template applied without its feature keys degrades gracefully (menus hide, defaults
   queue) rather than erroring.
3. **Switching is additive-only** (BR-038) and runs the compatibility checks in
   [CONFIGURATION_ENGINE.md](CONFIGURATION_ENGINE.md) §6 — e.g., switching
   `industry.restaurant` → `industry.food_manufacturing` adds production menus without
   touching POS history.
4. **Industries not listed here** (hospitals, schools, agriculture) are explicit non-goals
   until a decision record adds them ([../SCOPE_AND_NON_GOALS.md](../SCOPE_AND_NON_GOALS.md) §5);
   the framework must make adding them possible without core changes.
