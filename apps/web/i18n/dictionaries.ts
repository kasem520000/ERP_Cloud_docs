/**
 * Typed AR/EN dictionaries (PHASE-003 identity/sessions/admin screens + the
 * PHASE-004 tenancy/platform screens, task P4-T12a). 100% key parity between
 * locales is enforced twice:
 *
 *   1. Statically — both literals are assigned to `Record<Locale, Dictionary>`
 *      so TypeScript rejects a missing or extra key on either side.
 *   2. At runtime — `assertDictionaryParity()` below executes at module load
 *      (every layout render imports this module), satisfying the "parity
 *      check script green" acceptance without a separate test runner.
 *
 * Arabic is the default locale (Arabic-first, docs/ui/RTL_DESIGN_RULES.md).
 */
export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export interface Dictionary {
  appTitle: string;
  switchLabel: string;
  signOut: string;
  loading: string;
  phaseNote: string;

  navHome: string;
  navUsers: string;
  navSessions: string;
  navMfa: string;
  navRoles: string;
  navPassword: string;

  loginTitle: string;
  loginSubtitle: string;
  loginEmailLabel: string;
  loginPasswordLabel: string;
  loginMfaLabel: string;
  loginMfaHint: string;
  loginMfaShow: string;
  loginMfaHide: string;
  loginSubmit: string;
  loginForgotLink: string;
  loginErrorInvalidCredentials: string;
  loginErrorMfaRequired: string;
  loginErrorRateLimited: string;
  loginErrorAccountLocked: string;
  loginErrorGeneric: string;

  forgotTitle: string;
  forgotDescription: string;
  forgotEmailLabel: string;
  forgotSubmit: string;
  forgotSuccess: string;
  forgotBack: string;

  acceptTitle: string;
  acceptTenantLabel: string;
  acceptRoleLabel: string;
  acceptEmailLabel: string;
  acceptFullNameLabel: string;
  acceptPasswordLabel: string;
  acceptPasswordHint: string;
  acceptSubmit: string;
  acceptErrorExpired: string;
  acceptErrorRevoked: string;
  acceptErrorAccepted: string;
  acceptErrorNotFound: string;
  acceptErrorGeneric: string;

  homeWelcome: string;
  homeTenantLabel: string;
  homeSwitchTenant: string;
  homeRoleLabel: string;
  homePermissionsLabel: string;
  homeScreens: string;

  usersTitle: string;
  usersNoPermission: string;
  usersColEmail: string;
  usersColName: string;
  usersColRole: string;
  usersColStatus: string;
  usersColLastLogin: string;
  usersNever: string;
  usersEmpty: string;
  usersInviteTitle: string;
  usersInviteEmailLabel: string;
  usersInviteRoleLabel: string;
  usersInviteSubmit: string;
  usersInviteLinkTitle: string;
  usersInviteExpiresLabel: string;
  usersInvitationsTitle: string;
  usersColExpires: string;
  usersColActions: string;
  usersRevoke: string;
  usersNoRoles: string;
  usersEmptyInvitations: string;

  statusActive: string;
  statusPending: string;
  statusRevoked: string;
  statusExpired: string;
  statusAccepted: string;
  statusSuspended: string;

  sessionsTitle: string;
  sessionsHint: string;
  sessionsColUser: string;
  sessionsColCreated: string;
  sessionsColExpires: string;
  sessionsColLastSeen: string;
  sessionsColIp: string;
  sessionsRevoke: string;
  sessionsEmpty: string;

  mfaTitle: string;
  mfaDescription: string;
  mfaEnrollTitle: string;
  mfaEnrollButton: string;
  mfaSecretLabel: string;
  mfaOtpauthLabel: string;
  mfaEnrollHint: string;
  mfaVerifyTitle: string;
  mfaVerifyCodeLabel: string;
  mfaVerifySubmit: string;
  mfaVerified: string;
  mfaRecoveryTitle: string;
  mfaRecoveryDescription: string;
  mfaRecoveryGenerate: string;
  mfaRecoveryRegenerate: string;
  mfaInvalidCode: string;
  mfaNeedConfirmed: string;

  rolesTitle: string;
  rolesDescription: string;
  rolesTenantTitle: string;
  rolesTemplatesTitle: string;
  rolesColKey: string;
  rolesColName: string;
  rolesColSystem: string;
  rolesColActions: string;
  rolesClone: string;
  rolesCloned: string;
  rolesYes: string;
  rolesNo: string;

  passwordTitle: string;
  passwordDescription: string;
  passwordCurrentLabel: string;
  passwordNextLabel: string;
  passwordNextHint: string;
  passwordSubmit: string;
  passwordSuccess: string;
  passwordErrorCurrent: string;

  errorsForbidden: string;
  errorsUnauthorized: string;
  errorsValidation: string;
  errorsNotFound: string;
  errorsNetwork: string;
  errorsGeneric: string;
  errorsRateLimited: string;

  // -- P4-T12a (PHASE-004): navigation ---------------------------------------
  navOnboarding: string;
  navBranches: string;
  navSettings: string;
  navSupport: string;
  navPlatformSection: string;
  navPlatformConsole: string;
  navPlatformAudit: string;

  // -- P4-T12a: shared labels -------------------------------------------------
  statusInactive: string;
  statusClosed: string;
  statusTerminated: string;
  taxStatusLabel: string;
  taxStatusRegistered: string;
  taxStatusNotRegistered: string;
  taxStatusDeregistered: string;
  taxNumberLabel: string;
  fiscalStartMonthLabel: string;
  numberingAssignAtLabel: string;
  numberingAssignAtPosting: string;
  numberingAssignAtApproval: string;
  localeArabic: string;
  localeEnglish: string;

  // -- P4-T12a: register (public) ----------------------------------------------
  registerTitle: string;
  registerSubtitle: string;
  registerBusinessNameLabel: string;
  registerBusinessNameArLabel: string;
  registerCountryLabel: string;
  registerCurrencyLabel: string;
  registerTemplateLabel: string;
  registerTaxNumberHint: string;
  registerOwnerSection: string;
  registerOwnerEmailLabel: string;
  registerOwnerNameLabel: string;
  registerSubmit: string;
  registerSuccessTitle: string;
  registerSuccessBody: string;
  registerGoLogin: string;
  registerLoginPrompt: string;
  registerErrorEmailTaken: string;
  registerErrorOptions: string;

  // -- P4-T12a: onboarding ------------------------------------------------------
  onboardingTitle: string;
  onboardingSubtitle: string;
  onboardingProvisionButton: string;
  onboardingResultTitle: string;
  onboardingRolesLabel: string;
  onboardingAccountsLabel: string;
  onboardingPurposesLabel: string;
  onboardingSettingsLabel: string;
  onboardingCreatedCount: string;
  onboardingZeroDuplicatesHint: string;
  onboardingGoHome: string;
  onboardingGoBranches: string;

  // -- P4-T12a: branches --------------------------------------------------------
  branchesTitle: string;
  branchesEmpty: string;
  branchesColCode: string;
  branchesColName: string;
  branchesColNameAr: string;
  branchesCreateTitle: string;
  branchesCodeLabel: string;
  branchesNameLabel: string;
  branchesNameArLabel: string;
  branchesCreateSubmit: string;
  branchesActivate: string;
  branchesDeactivate: string;
  branchesErrorCodeTaken: string;

  // -- P4-T12a: tenant settings --------------------------------------------------
  settingsTitle: string;
  settingsProfileTitle: string;
  settingsNameLabel: string;
  settingsNameArLabel: string;
  settingsTimezoneLabel: string;
  settingsProfileSubmit: string;
  settingsProfileSaved: string;
  settingsGeneralTitle: string;
  settingsDefaultLocaleLabel: string;
  settingsNumeralSystemLabel: string;
  settingsNumeralLatn: string;
  settingsNumeralArab: string;
  settingsHijriLabel: string;
  settingsHijriHint: string;
  settingsFiscalNumberingTitle: string;
  settingsSupportTitle: string;
  settingsSupportOptInLabel: string;
  settingsSupportOptInWarning: string;
  settingsTaxTitle: string;
  settingsTaxPairHint: string;
  settingsSave: string;
  settingsSaved: string;
  settingsErrorInvalidValue: string;

  // -- P4-T12a: support sessions (tenant plane) ----------------------------------
  supportSessionsTitle: string;
  supportSessionsHint: string;
  supportColReason: string;
  supportColTicket: string;
  supportColOpened: string;
  supportColClosed: string;
  supportColOptIn: string;
  supportEmpty: string;
  supportTerminate: string;
  supportErrorAccessDenied: string;
  supportErrorExpired: string;
  supportErrorNotActive: string;

  // -- P4-T12a: tenancy error strings --------------------------------------------
  tenancyErrorFeatureNotEntitled: string;
  tenancyErrorDependenciesMissing: string;

  // -- P4-T12a: platform console -------------------------------------------------
  platformConsoleTitle: string;
  platformNoAccess: string;
  platformTenantBadge: string;
  platformSearchLabel: string;
  platformSearchSubmit: string;
  platformColTenant: string;
  platformColCountry: string;
  platformColPlan: string;
  platformColCreated: string;
  platformEmpty: string;
  platformProfileTitle: string;
  platformPlanTitle: string;
  platformPlanCurrentLabel: string;
  platformPlanNone: string;
  platformPlanAssignTitle: string;
  platformPlanLabel: string;
  platformTrialDaysLabel: string;
  platformPlanSubmit: string;
  platformPlanAssigned: string;
  platformEntitlementsTitle: string;
  platformColFeatureKey: string;
  platformColSource: string;
  platformEntitlementsEmpty: string;
  platformGrantTitle: string;
  platformGrantFeatureLabel: string;
  platformGrantSourceLabel: string;
  platformGrantExpiresLabel: string;
  platformGrantExpiresHint: string;
  platformGrantReasonLabel: string;
  platformGrantSubmit: string;
  platformGrantDone: string;
  platformRevoke: string;
  platformRevokeReasonLabel: string;
  platformGrantExpiryRequired: string;
  platformGrantUnknownKey: string;
  platformMembershipsTitle: string;
  platformBranchesTitle: string;
  platformLifecycleTitle: string;
  platformReasonLabel: string;
  platformSuspendButton: string;
  platformRestoreButton: string;
  platformSuspendDone: string;
  platformRestoreDone: string;
  platformSupportTitle: string;
  platformSupportOpenTitle: string;
  platformSupportReasonLabel: string;
  platformSupportTicketLabel: string;
  platformSupportHoursLabel: string;
  platformSupportOpenSubmit: string;
  platformSupportClose: string;
  platformSupportCloseReasonLabel: string;
  platformSupportSessionLabel: string;
  platformReadDataTitle: string;
  platformReadResourceLabel: string;
  platformReadSubmit: string;
  platformNoActiveSession: string;
  resourceUsers: string;
  resourceMemberships: string;
  resourceRoles: string;
  resourceBranches: string;
  resourceSettings: string;
  resourceEntitlements: string;
  resourceSubscription: string;
  resourceAccounts: string;
  resourceAuditEvents: string;

  // -- P4-T12a: platform audit viewer ----------------------------------------------
  platformAuditTitle: string;
  platformAuditPlatformOnly: string;
  platformAuditTenantFilter: string;
  platformAuditActionFilter: string;
  platformAuditApply: string;
  platformAuditColAt: string;
  platformAuditColAction: string;
  platformAuditColActor: string;
  platformAuditViaPlatform: string;
  platformAuditNextPage: string;
  platformAuditEmpty: string;
  platformErrorInvalidTransition: string;
  platformErrorPlanNotFound: string;
}

const ar: Dictionary = {
  appTitle: "منصة الأعمال الشاملة",
  switchLabel: "English",
  signOut: "تسجيل الخروج",
  loading: "جارٍ التحميل...",
  phaseNote: "واجهة المرحلة 003 (PHASE-003) — الدخول والجلسات والشاشات الإدارية عبر وسيط الويب الآمن (BFF).",

  navHome: "الرئيسية",
  navUsers: "المستخدمون والدعوات",
  navSessions: "الجلسات",
  navMfa: "التحقق بخطوتين",
  navRoles: "الأدوار",
  navPassword: "كلمة المرور",

  loginTitle: "تسجيل الدخول",
  loginSubtitle: "أدخل بيانات حسابك للوصول إلى المنصة.",
  loginEmailLabel: "البريد الإلكتروني",
  loginPasswordLabel: "كلمة المرور",
  loginMfaLabel: "رمز التحقق (MFA)",
  loginMfaHint: "ستة أرقام من تطبيق المصادقة.",
  loginMfaShow: "إظهار حقل رمز التحقق",
  loginMfaHide: "إخفاء حقل رمز التحقق",
  loginSubmit: "دخول",
  loginForgotLink: "نسيت كلمة المرور؟",
  loginErrorInvalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  loginErrorMfaRequired: "هذا الحساب محمي بالتحقق بخطوتين — أدخل رمز التحقق.",
  loginErrorRateLimited: "محاولات كثيرة — أعد المحاولة بعد {seconds} ثانية.",
  loginErrorAccountLocked: "الحساب مقفل مؤقتًا — أعد المحاولة بعد {seconds} ثانية.",
  loginErrorGeneric: "تعذّر تسجيل الدخول — حاول مرة أخرى.",

  forgotTitle: "استعادة كلمة المرور",
  forgotDescription: "أدخل بريدك الإلكتروني، وستصلك رسالة برابط إعادة التعيين إذا كان الحساب مسجلًا.",
  forgotEmailLabel: "البريد الإلكتروني",
  forgotSubmit: "إرسال رابط الاستعادة",
  forgotSuccess: "إذا كان هذا البريد مسجلًا لدينا فستصله رسالة تحتوي رابط إعادة التعيين.",
  forgotBack: "العودة إلى تسجيل الدخول",

  acceptTitle: "قبول الدعوة",
  acceptTenantLabel: "المنشأة",
  acceptRoleLabel: "الدور",
  acceptEmailLabel: "البريد الإلكتروني المدعو",
  acceptFullNameLabel: "الاسم الكامل",
  acceptPasswordLabel: "كلمة مرور جديدة",
  acceptPasswordHint: "10 أحرف على الأقل.",
  acceptSubmit: "إنشاء الحساب والدخول",
  acceptErrorExpired: "انتهت صلاحية هذه الدعوة.",
  acceptErrorRevoked: "تم إلغاء هذه الدعوة.",
  acceptErrorAccepted: "تم استخدام هذه الدعوة مسبقًا.",
  acceptErrorNotFound: "رابط الدعوة غير صالح.",
  acceptErrorGeneric: "تعذّر قبول الدعوة.",

  homeWelcome: "مرحبًا، {name}",
  homeTenantLabel: "المنشأة النشطة",
  homeSwitchTenant: "تبديل المنشأة",
  homeRoleLabel: "دورك الحالي",
  homePermissionsLabel: "عدد الصلاحيات الممنوحة: {count}",
  homeScreens: "الشاشات الإدارية",

  usersTitle: "المستخدمون والدعوات",
  usersNoPermission: "ليست لديك صلاحية عرض هذه الشاشة.",
  usersColEmail: "البريد الإلكتروني",
  usersColName: "الاسم",
  usersColRole: "الدور",
  usersColStatus: "الحالة",
  usersColLastLogin: "آخر دخول",
  usersNever: "لم يسجل الدخول بعد",
  usersEmpty: "لا يوجد مستخدمون في هذه المنشأة بعد.",
  usersInviteTitle: "دعوة مستخدم",
  usersInviteEmailLabel: "بريد المدعو",
  usersInviteRoleLabel: "الدور عند الانضمام",
  usersInviteSubmit: "إرسال دعوة",
  usersInviteLinkTitle: "رابط القبول (بيئة التطوير — لا يوجد إرسال بريد فعلي):",
  usersInviteExpiresLabel: "تنتهي في:",
  usersInvitationsTitle: "الدعوات",
  usersColExpires: "تنتهي في",
  usersColActions: "إجراءات",
  usersRevoke: "إلغاء",
  usersNoRoles: "لا توجد أدوار متاحة للإسناد.",
  usersEmptyInvitations: "لا توجد دعوات.",

  statusActive: "نشط",
  statusPending: "معلّق",
  statusRevoked: "ملغى",
  statusExpired: "منتهي",
  statusAccepted: "مقبول",
  statusSuspended: "موقوف",

  sessionsTitle: "الجلسات النشطة",
  sessionsHint: "إلغاء أي جلسة يخرج صاحبها فورًا؛ ولإخراج نفسك من كل الأجهزة ألغِ جلساتك واحدة تلو الأخرى.",
  sessionsColUser: "المستخدم",
  sessionsColCreated: "بدأت في",
  sessionsColExpires: "تنتهي في",
  sessionsColLastSeen: "آخر نشاط",
  sessionsColIp: "عنوان IP",
  sessionsRevoke: "إلغاء الجلسة",
  sessionsEmpty: "لا توجد جلسات نشطة.",

  mfaTitle: "التحقق بخطوتين (TOTP)",
  mfaDescription: "اربط تطبيق مصادقة بحسابك، وأكّد الرمز، ثم أنشئ رموز الاستعادة.",
  mfaEnrollTitle: "1) بدء التسجيل",
  mfaEnrollButton: "بدء التسجيل",
  mfaSecretLabel: "المفتاح السري (أدخله يدويًا في تطبيق المصادقة):",
  mfaOtpauthLabel: "بيانات الربط otpauth (محتوى رمز QR):",
  mfaEnrollHint: "أدخل الرمز الحالي من تطبيق المصادقة لتأكيد التسجيل.",
  mfaVerifyTitle: "2) تأكيد الرمز",
  mfaVerifyCodeLabel: "رمز التحقق",
  mfaVerifySubmit: "تأكيد",
  mfaVerified: "تم تفعيل التحقق بخطوتين بنجاح.",
  mfaRecoveryTitle: "3) رموز الاستعادة",
  mfaRecoveryDescription: "تُعرض رموز الاستعادة مرة واحدة فقط — احفظها الآن في مكان آمن.",
  mfaRecoveryGenerate: "إنشاء رموز الاستعادة",
  mfaRecoveryRegenerate: "إعادة إنشاء الرموز",
  mfaInvalidCode: "رمز التحقق غير صحيح.",
  mfaNeedConfirmed: "أكّد التسجيل أولًا ثم أنشئ رموز الاستعادة.",

  rolesTitle: "الأدوار",
  rolesDescription: "استنسخ قالبًا معياريًا لإنشاء دور خاص بمنشأتك.",
  rolesTenantTitle: "أدوار المنشأة",
  rolesTemplatesTitle: "القوالب المعيارية (النظام)",
  rolesColKey: "المفتاح",
  rolesColName: "الاسم",
  rolesColSystem: "دور نظام؟",
  rolesColActions: "إجراءات",
  rolesClone: "استنساخ",
  rolesCloned: "تم إنشاء الدور {name}.",
  rolesYes: "نعم",
  rolesNo: "لا",

  passwordTitle: "تغيير كلمة المرور",
  passwordDescription: "بعد التغيير تُلغى جلساتك الأخرى ويبقى هذا المتصفح مسجلًا.",
  passwordCurrentLabel: "كلمة المرور الحالية",
  passwordNextLabel: "كلمة المرور الجديدة",
  passwordNextHint: "10 أحرف على الأقل.",
  passwordSubmit: "تغيير كلمة المرور",
  passwordSuccess: "تم تغيير كلمة المرور.",
  passwordErrorCurrent: "كلمة المرور الحالية غير صحيحة.",

  errorsForbidden: "ليست لديك صلاحية تنفيذ هذا الإجراء.",
  errorsUnauthorized: "انتهت الجلسة — سجّل الدخول من جديد.",
  errorsValidation: "بيانات غير صالحة — راجع الحقول.",
  errorsNotFound: "العنصر غير موجود.",
  errorsNetwork: "تعذّر الاتصال بالخادم.",
  errorsGeneric: "حدث خطأ غير متوقع.",
  errorsRateLimited: "محاولات كثيرة — أعد المحاولة بعد {seconds} ثانية.",

  navOnboarding: "تهيئة",
  navBranches: "الفروع",
  navSettings: "الإعدادات",
  navSupport: "جلسات الدعم",
  navPlatformSection: "إدارة المنصة",
  navPlatformConsole: "المنصة",
  navPlatformAudit: "سجل المنصة",

  statusInactive: "غير نشط",
  statusClosed: "مغلقة",
  statusTerminated: "موقوفة بالإنهاء",
  taxStatusLabel: "حالة التسجيل الضريبي",
  taxStatusRegistered: "مسجّل",
  taxStatusNotRegistered: "غير مسجّل",
  taxStatusDeregistered: "ملغى التسجيل",
  taxNumberLabel: "الرقم الضريبي",
  fiscalStartMonthLabel: "شهر بداية السنة المالية",
  numberingAssignAtLabel: "إسناد أرقام المستندات",
  numberingAssignAtPosting: "عند الترحيل",
  numberingAssignAtApproval: "عند الاعتماد",
  localeArabic: "العربية",
  localeEnglish: "English",

  registerTitle: "إنشاء منشأة جديدة",
  registerSubtitle: "أنشئ حساب مالك ومنشأة جديدة في خطوة واحدة، ثم ابدأ فترة تجريبية.",
  registerBusinessNameLabel: "اسم المنشأة (بالإنجليزية)",
  registerBusinessNameArLabel: "اسم المنشأة (بالعربية، اختياري)",
  registerCountryLabel: "الدولة",
  registerCurrencyLabel: "العملة الأساس (تُشتق من الدولة)",
  registerTemplateLabel: "قالب النشاط",
  registerTaxNumberHint: "مطلوب عند اختيار «مسجّل».",
  registerOwnerSection: "حساب المالك",
  registerOwnerEmailLabel: "بريد المالك الإلكتروني",
  registerOwnerNameLabel: "الاسم الكامل للمالك",
  registerSubmit: "إنشاء المنشأة",
  registerSuccessTitle: "تم إنشاء المنشأة بنجاح",
  registerSuccessBody: "راجع بريدك الإلكتروني ({email}) ثم سجّل الدخول. تنتهي الفترة التجريبية في {date}.",
  registerGoLogin: "سجّل الدخول",
  registerLoginPrompt: "لديك حساب بالفعل؟",
  registerErrorEmailTaken: "هذا البريد الإلكتروني مسجّل مسبقًا — سجّل الدخول بدلًا من إنشاء حساب جديد.",
  registerErrorOptions: "تعذّر تحميل خيارات التسجيل (الدول والقوالب) — أعد تحميل الصفحة.",

  onboardingTitle: "تهيئة مساحة العمل",
  onboardingSubtitle:
    "تُنشئ التهيئة أدوار المنشأة ودليل الحسابات وسياسات الترقيم الافتراضية. العملية آمنة للتكرار: إعادة تشغيلها لا تُنشئ نسخًا مكررة.",
  onboardingProvisionButton: "إعداد مساحة العمل",
  onboardingResultTitle: "نتيجة التهيئة",
  onboardingRolesLabel: "الأدوار",
  onboardingAccountsLabel: "الحسابات",
  onboardingPurposesLabel: "أغراض الحسابات",
  onboardingSettingsLabel: "الإعدادات",
  onboardingCreatedCount: "جديد: {created} — موجود مسبقًا: {existing}",
  onboardingZeroDuplicatesHint:
    "لم يُنشأ أي عنصر جديد — مساحة العمل مهيأة مسبقًا، وهذا يؤكد أن إعادة التشغيل لا تُنتج تكرارات.",
  onboardingGoHome: "الذهاب إلى الرئيسية",
  onboardingGoBranches: "إدارة الفروع",

  branchesTitle: "الفروع",
  branchesEmpty: "لا توجد فروع بعد.",
  branchesColCode: "الرمز",
  branchesColName: "الاسم",
  branchesColNameAr: "الاسم العربي",
  branchesCreateTitle: "إنشاء فرع",
  branchesCodeLabel: "رمز الفرع",
  branchesNameLabel: "اسم الفرع",
  branchesNameArLabel: "الاسم العربي (اختياري)",
  branchesCreateSubmit: "إضافة الفرع",
  branchesActivate: "تنشيط",
  branchesDeactivate: "تعطيل",
  branchesErrorCodeTaken: "رمز الفرع مستخدم مسبقًا في هذه المنشأة.",

  settingsTitle: "إعدادات المنشأة",
  settingsProfileTitle: "الملف التعريفي",
  settingsNameLabel: "الاسم (بالإنجليزية)",
  settingsNameArLabel: "الاسم العربي",
  settingsTimezoneLabel: "المنطقة الزمنية",
  settingsProfileSubmit: "حفظ الملف",
  settingsProfileSaved: "تم حفظ الملف التعريفي.",
  settingsGeneralTitle: "الإعدادات العامة",
  settingsDefaultLocaleLabel: "اللغة الافتراضية",
  settingsNumeralSystemLabel: "نظام الأرقام",
  settingsNumeralLatn: "أرقام غربية (123)",
  settingsNumeralArab: "أرقام عربية (١٢٣)",
  settingsHijriLabel: "عرض التاريخ الهجري",
  settingsHijriHint: "تراكب عرض فقط — السنوات المالية تبقى ميلادية.",
  settingsFiscalNumberingTitle: "التقويم المالي والترقيم",
  settingsSupportTitle: "الدعم",
  settingsSupportOptInLabel: "السماح بجلسات الدعم",
  settingsSupportOptInWarning:
    "تنبيه: تمكين هذا الخيار يسمح لفريق المنصة بفتح جلسات دعم محدودة الوقت ومُدقّقة لقراءة بيانات منشأتك.",
  settingsTaxTitle: "التسجيل الضريبي",
  settingsTaxPairHint:
    "يُتحقق من الحالة والرقم معًا: الرقم مطلوب أثناء «مسجّل» وممنوع في غير ذلك.",
  settingsSave: "حفظ",
  settingsSaved: "تم الحفظ.",
  settingsErrorInvalidValue: "قيمة غير صالحة لهذا الإعداد.",

  supportSessionsTitle: "جلسات الدعم",
  supportSessionsHint:
    "هذه الجلسات التي يفتحها فريق المنصة عند طلبك أو بموافقتك؛ يمكنك إنهاء أي جلسة نشطة قائمة على الموافقة في أي وقت.",
  supportColReason: "السبب",
  supportColTicket: "مرجع التذكرة",
  supportColOpened: "بدأت",
  supportColClosed: "أُغلقت",
  supportColOptIn: "بالموافقة؟",
  supportEmpty: "لا توجد جلسات دعم.",
  supportTerminate: "إنهاء الجلسة",
  supportErrorAccessDenied: "فتح جلسة الدعم يتطلب موافقة المنشأة أو مرجع تذكرة حادثة معلنًا.",
  supportErrorExpired: "انتهت صلاحية جلسة الدعم.",
  supportErrorNotActive: "هذه الجلسة ليست نشطة.",

  tenancyErrorFeatureNotEntitled: "هذه الميزة غير مفعّلة لمنشأتك.",
  tenancyErrorDependenciesMissing: "تفعيل الميزة يتطلب مفاتيح تابعة غير ممنوحة بعد: {keys}",

  platformConsoleTitle: "لوحة إدارة المنصة",
  platformNoAccess: "هذه منطقة إدارة المنصة — متاحة فقط لفريق عمليات المنصة.",
  platformTenantBadge: "منصة",
  platformSearchLabel: "البحث عن منشأة",
  platformSearchSubmit: "بحث",
  platformColTenant: "المنشأة",
  platformColCountry: "الدولة",
  platformColPlan: "الخطة",
  platformColCreated: "أُنشئت",
  platformEmpty: "لا توجد منشآت مطابقة.",
  platformProfileTitle: "الملف",
  platformPlanTitle: "الخطة والاشتراك",
  platformPlanCurrentLabel: "الخطة الحالية",
  platformPlanNone: "لا يوجد اشتراك نشط.",
  platformPlanAssignTitle: "تعيين خطة",
  platformPlanLabel: "الخطة",
  platformTrialDaysLabel: "أيام التجربة (اختياري)",
  platformPlanSubmit: "تعيين الخطة",
  platformPlanAssigned: "تم تعيين الخطة «{plan}» — المفاتيح الممنوحة: {count}.",
  platformEntitlementsTitle: "الميزات الممنوحة",
  platformColFeatureKey: "المفتاح",
  platformColSource: "المصدر",
  platformEntitlementsEmpty: "لا توجد ميزات ممنوحة.",
  platformGrantTitle: "منح ميزة",
  platformGrantFeatureLabel: "مفتاح الميزة",
  platformGrantSourceLabel: "المصدر",
  platformGrantExpiresLabel: "تاريخ الانتهاء",
  platformGrantExpiresHint: "مطلوب للمنح اليدوي (MANUAL).",
  platformGrantReasonLabel: "السبب",
  platformGrantSubmit: "منح",
  platformGrantDone: "تم منح الميزة.",
  platformRevoke: "سحب",
  platformRevokeReasonLabel: "سبب السحب",
  platformGrantExpiryRequired: "المنح اليدوي يتطلب تاريخ انتهاء صريحًا.",
  platformGrantUnknownKey: "مفتاح ميزة غير معروف.",
  platformMembershipsTitle: "الأعضاء",
  platformBranchesTitle: "فروع المنشأة",
  platformLifecycleTitle: "إيقاف واستعادة",
  platformReasonLabel: "السبب (مطلوب)",
  platformSuspendButton: "إيقاف المنشأة",
  platformRestoreButton: "استعادة المنشأة",
  platformSuspendDone: "تم إيقاف المنشأة — أُنهيت {count} جلسة مستخدم.",
  platformRestoreDone: "تمت استعادة المنشأة إلى الحالة النشطة.",
  platformSupportTitle: "جلسات الدعم",
  platformSupportOpenTitle: "فتح جلسة دعم",
  platformSupportReasonLabel: "السبب",
  platformSupportTicketLabel: "مرجع التذكرة (اختياري)",
  platformSupportHoursLabel: "المدة بالساعات (1-4)",
  platformSupportOpenSubmit: "فتح الجلسة",
  platformSupportClose: "إغلاق",
  platformSupportCloseReasonLabel: "سبب الإغلاق",
  platformSupportSessionLabel: "الجلسة النشطة",
  platformReadDataTitle: "قراءة بيانات المنشأة",
  platformReadResourceLabel: "المورد",
  platformReadSubmit: "قراءة",
  platformNoActiveSession: "لا توجد جلسة دعم نشطة — افتح جلسة أولًا.",
  resourceUsers: "المستخدمون",
  resourceMemberships: "العضويات",
  resourceRoles: "الأدوار",
  resourceBranches: "الفروع",
  resourceSettings: "الإعدادات",
  resourceEntitlements: "الميزات",
  resourceSubscription: "الاشتراك",
  resourceAccounts: "الحسابات",
  resourceAuditEvents: "أحداث التدقيق",

  platformAuditTitle: "سجل تدقيق المنصة",
  platformAuditPlatformOnly: "أحداث المنصة فقط",
  platformAuditTenantFilter: "معرّف المنشأة (اختياري)",
  platformAuditActionFilter: "الإجراء (اختياري)",
  platformAuditApply: "تصفية",
  platformAuditColAt: "الوقت",
  platformAuditColAction: "الإجراء",
  platformAuditColActor: "الفاعل",
  platformAuditViaPlatform: "عبر مشرف المنصة",
  platformAuditNextPage: "الصفحة التالية",
  platformAuditEmpty: "لا توجد أحداث.",
  platformErrorInvalidTransition: "حالة المنشأة لا تسمح بهذا الانتقال.",
  platformErrorPlanNotFound: "خطة غير معروفة.",
};

const en: Dictionary = {
  appTitle: "Universal Business ERP",
  switchLabel: "العربية",
  signOut: "Sign out",
  loading: "Loading...",
  phaseNote: "PHASE-003 UI — sign-in, sessions and admin screens via the secure web BFF.",

  navHome: "Home",
  navUsers: "Users & invitations",
  navSessions: "Sessions",
  navMfa: "Two-factor (TOTP)",
  navRoles: "Roles",
  navPassword: "Password",

  loginTitle: "Sign in",
  loginSubtitle: "Use your work account to access the platform.",
  loginEmailLabel: "Email",
  loginPasswordLabel: "Password",
  loginMfaLabel: "MFA code",
  loginMfaHint: "Six digits from your authenticator app.",
  loginMfaShow: "Enter an MFA code",
  loginMfaHide: "Hide the MFA code",
  loginSubmit: "Sign in",
  loginForgotLink: "Forgot your password?",
  loginErrorInvalidCredentials: "Email or password is incorrect.",
  loginErrorMfaRequired: "This account is protected with two-factor authentication — enter your MFA code.",
  loginErrorRateLimited: "Too many attempts — try again in {seconds} seconds.",
  loginErrorAccountLocked: "This account is temporarily locked — try again in {seconds} seconds.",
  loginErrorGeneric: "Could not sign you in — please try again.",

  forgotTitle: "Reset your password",
  forgotDescription: "Enter your email; if the account exists, a reset link will be sent to it.",
  forgotEmailLabel: "Email",
  forgotSubmit: "Send reset link",
  forgotSuccess: "If that email is registered, a password reset message is on its way.",
  forgotBack: "Back to sign in",

  acceptTitle: "Accept your invitation",
  acceptTenantLabel: "Organization",
  acceptRoleLabel: "Role",
  acceptEmailLabel: "Invited email",
  acceptFullNameLabel: "Full name",
  acceptPasswordLabel: "New password",
  acceptPasswordHint: "At least 10 characters.",
  acceptSubmit: "Create account and sign in",
  acceptErrorExpired: "This invitation has expired.",
  acceptErrorRevoked: "This invitation was revoked.",
  acceptErrorAccepted: "This invitation has already been used.",
  acceptErrorNotFound: "This invitation link is not valid.",
  acceptErrorGeneric: "Could not accept this invitation.",

  homeWelcome: "Welcome, {name}",
  homeTenantLabel: "Active organization",
  homeSwitchTenant: "Switch organization",
  homeRoleLabel: "Your role",
  homePermissionsLabel: "Granted permissions: {count}",
  homeScreens: "Admin screens",

  usersTitle: "Users & invitations",
  usersNoPermission: "You do not have permission to view this screen.",
  usersColEmail: "Email",
  usersColName: "Name",
  usersColRole: "Role",
  usersColStatus: "Status",
  usersColLastLogin: "Last sign-in",
  usersNever: "Never signed in",
  usersEmpty: "No users in this organization yet.",
  usersInviteTitle: "Invite a user",
  usersInviteEmailLabel: "Invitee email",
  usersInviteRoleLabel: "Role on joining",
  usersInviteSubmit: "Send invitation",
  usersInviteLinkTitle: "Accept link (dev environment — no real mail delivery):",
  usersInviteExpiresLabel: "Expires:",
  usersInvitationsTitle: "Invitations",
  usersColExpires: "Expires",
  usersColActions: "Actions",
  usersRevoke: "Revoke",
  usersNoRoles: "No roles are available to assign.",
  usersEmptyInvitations: "No invitations.",

  statusActive: "Active",
  statusPending: "Pending",
  statusRevoked: "Revoked",
  statusExpired: "Expired",
  statusAccepted: "Accepted",
  statusSuspended: "Suspended",

  sessionsTitle: "Active sessions",
  sessionsHint:
    "Revoking a session signs that device out immediately; to sign yourself out everywhere, revoke your sessions one by one.",
  sessionsColUser: "User",
  sessionsColCreated: "Started",
  sessionsColExpires: "Expires",
  sessionsColLastSeen: "Last seen",
  sessionsColIp: "IP address",
  sessionsRevoke: "Revoke session",
  sessionsEmpty: "No active sessions.",

  mfaTitle: "Two-factor authentication (TOTP)",
  mfaDescription: "Enroll an authenticator app, confirm with a code, then generate recovery codes.",
  mfaEnrollTitle: "Step 1 — Start enrollment",
  mfaEnrollButton: "Start enrollment",
  mfaSecretLabel: "Secret (enter it manually in your authenticator app):",
  mfaOtpauthLabel: "otpauth data (QR payload):",
  mfaEnrollHint: "Enter the current code from your authenticator app to confirm enrollment.",
  mfaVerifyTitle: "Step 2 — Confirm the code",
  mfaVerifyCodeLabel: "MFA code",
  mfaVerifySubmit: "Confirm",
  mfaVerified: "Two-factor authentication is now active.",
  mfaRecoveryTitle: "Step 3 — Recovery codes",
  mfaRecoveryDescription: "Recovery codes are shown once — store them somewhere safe now.",
  mfaRecoveryGenerate: "Generate recovery codes",
  mfaRecoveryRegenerate: "Regenerate codes",
  mfaInvalidCode: "That code is not valid.",
  mfaNeedConfirmed: "Confirm enrollment first, then generate recovery codes.",

  rolesTitle: "Roles",
  rolesDescription: "Clone a system template to create a role for your organization.",
  rolesTenantTitle: "Organization roles",
  rolesTemplatesTitle: "System templates",
  rolesColKey: "Key",
  rolesColName: "Name",
  rolesColSystem: "System?",
  rolesColActions: "Actions",
  rolesClone: "Clone",
  rolesCloned: "Role {name} created.",
  rolesYes: "Yes",
  rolesNo: "No",

  passwordTitle: "Change password",
  passwordDescription: "After the change your other sessions are revoked; this browser stays signed in.",
  passwordCurrentLabel: "Current password",
  passwordNextLabel: "New password",
  passwordNextHint: "At least 10 characters.",
  passwordSubmit: "Change password",
  passwordSuccess: "Your password has been changed.",
  passwordErrorCurrent: "Your current password is not correct.",

  errorsForbidden: "You do not have permission to do that.",
  errorsUnauthorized: "Your session has expired — sign in again.",
  errorsValidation: "Invalid input — please check the fields.",
  errorsNotFound: "Not found.",
  errorsNetwork: "Could not reach the server.",
  errorsGeneric: "Something went wrong.",
  errorsRateLimited: "Too many attempts — try again in {seconds} seconds.",

  navOnboarding: "Onboarding",
  navBranches: "Branches",
  navSettings: "Settings",
  navSupport: "Support sessions",
  navPlatformSection: "Platform administration",
  navPlatformConsole: "Platform",
  navPlatformAudit: "Platform audit",

  statusInactive: "Inactive",
  statusClosed: "Closed",
  statusTerminated: "Terminated",
  taxStatusLabel: "Tax registration status",
  taxStatusRegistered: "Registered",
  taxStatusNotRegistered: "Not registered",
  taxStatusDeregistered: "Deregistered",
  taxNumberLabel: "Tax registration number",
  fiscalStartMonthLabel: "Fiscal year start month",
  numberingAssignAtLabel: "Document number assignment",
  numberingAssignAtPosting: "At posting",
  numberingAssignAtApproval: "At approval",
  localeArabic: "العربية",
  localeEnglish: "English",

  registerTitle: "Create a new organization",
  registerSubtitle: "Create an owner account and a new organization in one step, then start a trial.",
  registerBusinessNameLabel: "Business name (English)",
  registerBusinessNameArLabel: "Business name (Arabic, optional)",
  registerCountryLabel: "Country",
  registerCurrencyLabel: "Base currency (derived from the country)",
  registerTemplateLabel: "Industry template",
  registerTaxNumberHint: "Required when the status is “Registered”.",
  registerOwnerSection: "Owner account",
  registerOwnerEmailLabel: "Owner email",
  registerOwnerNameLabel: "Owner full name",
  registerSubmit: "Create organization",
  registerSuccessTitle: "Your organization has been created",
  registerSuccessBody: "Check your email ({email}) then sign in. The trial period ends on {date}.",
  registerGoLogin: "Sign in",
  registerLoginPrompt: "Already have an account?",
  registerErrorEmailTaken: "This email is already registered — sign in instead of creating a new account.",
  registerErrorOptions: "Could not load the registration options (countries/templates) — reload the page.",

  onboardingTitle: "Workspace onboarding",
  onboardingSubtitle:
    "Provisioning creates your organization roles, the chart of accounts and the default numbering policies. It is safe to re-run: a second run creates no duplicates.",
  onboardingProvisionButton: "Provision workspace",
  onboardingResultTitle: "Provisioning result",
  onboardingRolesLabel: "Roles",
  onboardingAccountsLabel: "Accounts",
  onboardingPurposesLabel: "Account purposes",
  onboardingSettingsLabel: "Settings",
  onboardingCreatedCount: "Created: {created} — already existing: {existing}",
  onboardingZeroDuplicatesHint:
    "Nothing new was created — the workspace is already provisioned, which confirms that re-runs produce zero duplicates.",
  onboardingGoHome: "Go to home",
  onboardingGoBranches: "Manage branches",

  branchesTitle: "Branches",
  branchesEmpty: "No branches yet.",
  branchesColCode: "Code",
  branchesColName: "Name",
  branchesColNameAr: "Arabic name",
  branchesCreateTitle: "Create a branch",
  branchesCodeLabel: "Branch code",
  branchesNameLabel: "Branch name",
  branchesNameArLabel: "Arabic name (optional)",
  branchesCreateSubmit: "Add branch",
  branchesActivate: "Activate",
  branchesDeactivate: "Deactivate",
  branchesErrorCodeTaken: "This branch code is already used in this organization.",

  settingsTitle: "Organization settings",
  settingsProfileTitle: "Profile",
  settingsNameLabel: "Name (English)",
  settingsNameArLabel: "Arabic name",
  settingsTimezoneLabel: "Timezone",
  settingsProfileSubmit: "Save profile",
  settingsProfileSaved: "The profile has been saved.",
  settingsGeneralTitle: "General settings",
  settingsDefaultLocaleLabel: "Default locale",
  settingsNumeralSystemLabel: "Numeral system",
  settingsNumeralLatn: "Western digits (123)",
  settingsNumeralArab: "Arabic-Indic digits (١٢٣)",
  settingsHijriLabel: "Hijri date display",
  settingsHijriHint: "Display-only overlay — fiscal years stay Gregorian.",
  settingsFiscalNumberingTitle: "Fiscal calendar & numbering",
  settingsSupportTitle: "Support",
  settingsSupportOptInLabel: "Allow support sessions",
  settingsSupportOptInWarning:
    "Warning: enabling this allows the platform team to open time-boxed, audited support sessions that read your organization's data.",
  settingsTaxTitle: "Tax registration",
  settingsTaxPairHint:
    "The status and number are validated as a pair: the number is required while “Registered” and rejected otherwise.",
  settingsSave: "Save",
  settingsSaved: "Saved.",
  settingsErrorInvalidValue: "Invalid value for this setting.",

  supportSessionsTitle: "Support sessions",
  supportSessionsHint:
    "These are sessions the platform team opens on your request or with your consent; you can terminate any active opt-in session at any time.",
  supportColReason: "Reason",
  supportColTicket: "Ticket ref",
  supportColOpened: "Opened",
  supportColClosed: "Closed",
  supportColOptIn: "Opt-in?",
  supportEmpty: "No support sessions.",
  supportTerminate: "Terminate session",
  supportErrorAccessDenied:
    "Opening a support session requires the organization's opt-in or a declared incident ticket reference.",
  supportErrorExpired: "The support session has expired.",
  supportErrorNotActive: "This session is not active.",

  tenancyErrorFeatureNotEntitled: "This feature is not enabled for your organization.",
  tenancyErrorDependenciesMissing: "Activating the feature requires dependency keys that are not granted yet: {keys}",

  platformConsoleTitle: "Platform administration console",
  platformNoAccess: "This is the platform administration area — available to platform operations staff only.",
  platformTenantBadge: "Platform",
  platformSearchLabel: "Search organizations",
  platformSearchSubmit: "Search",
  platformColTenant: "Organization",
  platformColCountry: "Country",
  platformColPlan: "Plan",
  platformColCreated: "Created",
  platformEmpty: "No matching organizations.",
  platformProfileTitle: "Profile",
  platformPlanTitle: "Plan & subscription",
  platformPlanCurrentLabel: "Current plan",
  platformPlanNone: "No active subscription.",
  platformPlanAssignTitle: "Assign a plan",
  platformPlanLabel: "Plan",
  platformTrialDaysLabel: "Trial days (optional)",
  platformPlanSubmit: "Assign plan",
  platformPlanAssigned: "Plan “{plan}” assigned — granted keys: {count}.",
  platformEntitlementsTitle: "Entitlements",
  platformColFeatureKey: "Feature key",
  platformColSource: "Source",
  platformEntitlementsEmpty: "No entitlements granted.",
  platformGrantTitle: "Grant a feature",
  platformGrantFeatureLabel: "Feature key",
  platformGrantSourceLabel: "Source",
  platformGrantExpiresLabel: "Expires at",
  platformGrantExpiresHint: "Required for MANUAL grants.",
  platformGrantReasonLabel: "Reason",
  platformGrantSubmit: "Grant",
  platformGrantDone: "The feature has been granted.",
  platformRevoke: "Revoke",
  platformRevokeReasonLabel: "Revocation reason",
  platformGrantExpiryRequired: "Manual grants must carry an explicit expiry.",
  platformGrantUnknownKey: "Unknown feature key.",
  platformMembershipsTitle: "Memberships",
  platformBranchesTitle: "Organization branches",
  platformLifecycleTitle: "Suspend & restore",
  platformReasonLabel: "Reason (required)",
  platformSuspendButton: "Suspend organization",
  platformRestoreButton: "Restore organization",
  platformSuspendDone: "Organization suspended — {count} user session(s) killed.",
  platformRestoreDone: "Organization restored to active.",
  platformSupportTitle: "Support sessions",
  platformSupportOpenTitle: "Open a support session",
  platformSupportReasonLabel: "Reason",
  platformSupportTicketLabel: "Ticket reference (optional)",
  platformSupportHoursLabel: "Duration in hours (1-4)",
  platformSupportOpenSubmit: "Open session",
  platformSupportClose: "Close",
  platformSupportCloseReasonLabel: "Close reason",
  platformSupportSessionLabel: "Active session",
  platformReadDataTitle: "Read organization data",
  platformReadResourceLabel: "Resource",
  platformReadSubmit: "Read",
  platformNoActiveSession: "No active support session — open one first.",
  resourceUsers: "Users",
  resourceMemberships: "Memberships",
  resourceRoles: "Roles",
  resourceBranches: "Branches",
  resourceSettings: "Settings",
  resourceEntitlements: "Entitlements",
  resourceSubscription: "Subscription",
  resourceAccounts: "Accounts",
  resourceAuditEvents: "Audit events",

  platformAuditTitle: "Platform audit log",
  platformAuditPlatformOnly: "Platform events only",
  platformAuditTenantFilter: "Tenant id (optional)",
  platformAuditActionFilter: "Action (optional)",
  platformAuditApply: "Apply filters",
  platformAuditColAt: "When",
  platformAuditColAction: "Action",
  platformAuditColActor: "Actor",
  platformAuditViaPlatform: "Via platform admin",
  platformAuditNextPage: "Next page",
  platformAuditEmpty: "No events.",
  platformErrorInvalidTransition: "The organization's state does not allow this transition.",
  platformErrorPlanNotFound: "Unknown plan.",
};

const dictionaries: Record<Locale, Dictionary> = { ar, en };

/**
 * Gregorian month names (index 0 = January) for the fiscal-start-month
 * select (P4-T12a onboarding + settings screens). Fiscal years stay
 * Gregorian by design (A-004) — these are display labels only.
 */
export const monthNames: Record<Locale, readonly string[]> = {
  ar: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

/**
 * Key-parity assertion: `Object.keys(ar) === Object.keys(en)`. TypeScript
 * already guarantees this through the `Dictionary` interface; the runtime
 * check keeps the parity contract green even if the dictionaries are ever
 * assembled dynamically. Executed at module load on first import.
 */
export function assertDictionaryParity(): void {
  const arKeys = Object.keys(dictionaries.ar).sort().join(",");
  const enKeys = Object.keys(dictionaries.en).sort().join(",");
  if (arKeys !== enKeys) {
    throw new Error(`dictionary key parity violation between "ar" and "en"`);
  }
}

assertDictionaryParity();

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/** The "other" locale — locale switching is a 1:1 link swap. */
export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
