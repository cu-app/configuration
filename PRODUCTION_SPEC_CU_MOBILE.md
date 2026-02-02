# Production Spec: Credit Union Mobile App (Any CU)

This spec documents the **DECEPTACON/Mobile (SunBlock)** API surface and defines how the **cu_mx_app** (Flutter) becomes a **real production app configured for any credit union** via multi-tenant config and a backend-agnostic BFF contract.

---

## 1. Legacy Source: SunBlock/Mobile (Xamarin)

The reference mobile app lives at `DECEPTACON/Mobile`. It is a Xamarin app that talks to a **SunBlock** backend over HTTPS. PowerOn/Symitar calls are made **by the SunBlock server**, not by the mobile client.

### 1.1 Base URLs (per environment)

| Env       | Base URL |
|----------|----------|
| Dev      | `https://sunblock-dev.suncoastcreditunion.com/` |
| UAT      | `https://sunblock-uat.suncoastcreditunion.com/` |
| Prod     | `https://sunblock.suncoastcreditunion.com/` |

Base URL is **hardcoded per build** (`AppSettings.SunBlockUrl`). For “any CU” we replace this with **tenant-scoped config** (see §3).

### 1.2 Service Paths (.svc)

- **Main service**: `Mobile/iOS/iPhone/Service.svc/` or `Mobile/Android/Phone/Service.svc/` (phone); iPad/Tablet variants for larger devices.
- **Analyze**: `Mobile/iOS/iPhone/Analyze.svc/` — culture, feature toggles, startup, token generation, locations.
- **Remote deposits**: `RemoteDeposits/RemoteDepositsService.svc/`
- **Bill pay**: `BillPay/V2/BillPayService.svc/`
- **Device registration**: `DeviceRegistration/DeviceRegistrationService.svc/`

Full URL = `SunBlockUrl + SunBlockServiceUrl + "vN/OperationName"` (POST, JSON).

### 1.3 Authentication

- **Session token**: After login, the app stores `SecureSettings.Instance.SunBlockToken` and sends it on every call (e.g. header `SessionToken` or similar; exact header name is backend-specific).
- **Pre-login**: `GenerateTokenAndLogs`, `AssociatePublicKeyWithDevice` use no token; `LoginProcess` returns session data used to populate the token.
- **Bearer**: `GenerateBearerToken` returns a bearer token for use with external/SSO flows.

### 1.4 API Catalog (SunBlock – core operations)

**Analyze.svc**

| Operation | Version | Purpose |
|-----------|---------|--------|
| GenerateTokenAndLogs | v1 | Pre-auth analytics/token |
| AssociatePublicKeyWithDevice | v1 | Device binding |
| GetCultureConfiguration | v1 | Locale/region |
| GetFeatureToggles | v1 | Feature flags |
| GetStartupSettings | v1 | App startup config |
| GetWaitSmarterUrl | v1 | External URL |
| GetOnboardingInfo | v2 | Onboarding content |
| Locations | v2 | Branch/ATM locations |

**Service.svc (auth)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| LoginProcess | v1 | Login, returns session |
| OutOfBandChallengeRequired | v1 | MFA / OOB |
| SendOutOfBandCode / SendOutOfBandVerification | v1 | OOB delivery |
| VerifyOutOfBandCode | v1 | OOB verify |
| EnableOnlineAccess | v1 | Enrollment |
| GetChangePasswordInformation | v1 | Password change |
| UpdatePassword | v2 | Password update |
| EnrollFingerprintAuthorization | v1 | Biometric enrollment |
| AuthenticateHost | v3 | Host auth |
| AuthenticateFingerprint | v4 | Biometric auth |
| LogOut | v1 | Logout |
| RegisterForNotification | v1 | Push registration |
| SessionIsActive | v1 | Session check |
| GetBiometricInformation | v1 | Biometric status |
| GetAccountVerificationOptions | v1 | Verification options |
| DelayPasswordNotification | v1 | Password reminder |
| SetFlags | v1 | User flags |
| GenerateBearerToken | v1 | Bearer for SSO |

**Service.svc (accounts)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| AccountList | v1 | Account list |
| RemoteDepositsAccountList | v1 | RDC source accounts |
| BillPaySourceAccountList | v1 | Bill pay source accounts |
| TransferSourceAccountList | v1 | Transfer from |
| TransferTargetAccountList | v1 | Transfer to |
| SubAccountsFundingAccountList | v1 | Sub-account funding |
| AccountTransactionList | v2 | Transactions |
| NextAccountTransactionList | v1 | Transaction paging |
| GetRocketAccountsInformation | v1 | Rocket product |
| CreateRocketChecking | v1 | Rocket onboarding |
| GetMemberInformation | v2 | Member profile |
| GetMemberEmailAddress | v1 | Email |
| GetTransactionDisputeInformation | v2 | Disputes |
| StoreAndScanDocument | v1 | Document upload |
| GetTransactionDisputeHistory | v1 | Dispute history |
| SubmitTransactionDispute | v3 | Submit dispute |
| ExecuteStopPayment | v1 | Stop payment |
| UpdateProfileInformation | v1 | Profile update |
| GetUpdateProfileConfig | v1 | Profile config |
| GetPayoffQuote | v1 | Loan payoff |
| EmailPayoffQuote | v1 | Email payoff |

**Service.svc (transfers)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| TransferExecute | v3 | Execute transfer |
| GetTransferFavorites | v2 | Favorites list |
| SetTransferFavorites | v2 | Save favorites |

**Service.svc (cards)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| GetTravelNotificationInfo | v1 | Travel notices |
| SubmitTravelNotifications | v1 | Submit travel |
| CardList | v1 | Card list |
| GetMembershipCard | v1 | Digital membership card |
| GetCardImages | v1 | Card art |
| RetrieveCardRewardsSingleSignOn | v1 | Rewards SSO |
| RequestCustomCard | v1 | Card order |
| BlockAtmDebitCard | v1 | ATM block |
| CardBlock | v1 | Card block |

**Service.svc (documents / eStatements)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| GetMemberDocumentCenter | v1 | Document center |
| GetDocumentCenterFile | v1 | File download |
| UploadDocumentCenterFile | v1 | Upload |
| SecurityScanDocument | v1 | Scan |
| QueryDownloadDocuments | v1 | Download list |
| IsEDocumentEnrolled | v1 | E-doc enrollment |
| SetEDocumentEnrollment | v1 | Set enrollment |
| GetEDocuments | v2 | E-documents |
| GetEDocumentAlertSettings | v1 | E-doc alerts |
| SetEDocumentAlertSettings | v1 | Set e-doc alerts |
| GetCheckImages | v1 | Check images (OnBase) |

**Service.svc (remote deposit)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| DepositCheck | v2 | Submit deposit (Service.svc) |

**RemoteDepositsService.svc**

| Operation | Purpose |
|-----------|--------|
| IsRemoteDepositsEnabled | RDC enabled |
| GetMemberRemoteDepositsInfo | v1/v2 Member RDC info |
| RetrieveRemoteDepositTransactions | History |
| SetMemberRemoteDepositsInfo | Update RDC |
| IsRemoteDepositsRestricted | Restrictions |

**Service.svc (messaging / alerts)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| RetrieveMessageThreadByMember | v1 | Threads |
| InsertOrUpdateMessageThread | v1 | Thread upsert |
| SendMessage | v1 | Send |
| ReplyToThread | v1 | Reply |
| GetUnreadMessageCounts | v1 | Counts |
| GetMessageSubjects | v1 | Subjects |
| GetPushNotificationSettings | v1 | Push settings |
| UpdatePushNotificationAlertSettings | v1 | Push alerts |
| GetInsightsAlertSettings | v1 | Insights alerts |
| UpdateInsightAlertSettings | v1 | Update insights |
| UpdateSecurityAlertSettings | v1 | Security alerts |
| UpdateEDocumentAlertSettings | v1 | E-doc alerts |
| UpdateAvailableBalanceAlertSettings | v1 | Balance alerts |
| UpdateNsfAlertSettings | v1 | NSF alerts |
| UpdateDirectDepositAlertSettings | v1 | DD alerts |
| UpdatePaymentReminderAlertSettings | v1 | Payment reminders |

**Service.svc (external / SSO)**

| Operation | Version | Purpose |
|-----------|---------|--------|
| IsMemberEnrolledInPayRailz | v1 | PayRailz |
| SetMemberPayRailzEnrollment | v1 | PayRailz enroll |
| GetPayRailzSsoUiInfo | v2 | PayRailz SSO |
| IsMemberEnrolledInSunMoney | v2 | SunMoney |
| SetMemberSunMoneyEnrollment | v2 | SunMoney enroll |
| GetMxUser | v1 | MX |
| GetInsightsUrl | v1 | Insights URL |
| RetrieveGeezeoSingleSignOn | v2 | Geezeo SSO |
| RetrieveLoanApplicationSingleSignOn | v1 | Loan app SSO |
| GetOpenShareAccountUrl | v1 | Open account |
| GetDigitalEnrollmentUrl | v1 | Digital enrollment |
| GetTrueCarUrl | v1 | TrueCar |
| GetCarvanaUrl | v1 | Carvana |
| GetSuncoastRealtyUrl | v1 | Realty |
| RetrieveCunexusSingleSignOn | v1 | Cunexus SSO |
| RetrieveCunexusMemberOffers | v1 | Cunexus offers |
| RetrieveClickSwitchSingleSignOn | v2 | ClickSwitch SSO |

**BillPayService.svc**

| Operation | Purpose |
|-----------|--------|
| GetHolidays | Bill pay calendar |

**DeviceRegistrationService.svc**

| Operation | Purpose |
|-----------|--------|
| GetDeviceMagicLinkRegistrationStatusInfo | Magic link status |
| StartMagicLinkRegistrationSession | Start |
| ValidateSMSLink | Validate SMS |
| ValidateEmailLink | Validate email |
| CancelMagicLinkRegistration | Cancel |

---

## 2. Multi-Tenant Config Model

The app must work for **any credit union**. Tenant is identified by **tenant ID** (e.g. charter number or slug).

### 2.1 Where config comes from

- **Config API**: `GET /api/config/[tenantId]` (configuration-matrix-build Next.js app).
- **Response** (from `app/api/config/[tenantId]/route.ts`):

```json
{
  "tenant_id": "12345",
  "tenant_name": "Example Credit Union",
  "version": "1.0.0",
  "updated_at": "2025-01-30T00:00:00Z",
  "config": { ... }
}
```

- **config** is the full JSON blob stored in `cu_configs.config` (Supabase). It can align with `CreditUnionConfig` / `UnifiedConfig` in this repo (`types/cu-config.ts`, `types/unified-config.ts`).

### 2.2 What the mobile app needs from config

- **Identity / branding**: `tenant_name`, `content.app_name`, `tokens.logo`, `tokens.color.primary`, etc.
- **API base URL**: e.g. `deploy.api` or a dedicated `mobile.api_base_url` so the app knows which BFF/backend to call.
- **Feature flags**: `features.*` (e.g. `bill_pay`, `mobile_deposit`, `p2p`) to show/hide screens and actions.
- **Content**: `content.member_term`, `content.share_term`, `content.welcome_message`, `content.error.*`, `content.legal.*`.
- **Rules**: Transfer limits, session timeout, etc., for client-side validation and messaging.

The app **must not** hardcode SunBlock URLs; it must use **config + BFF contract** (see §3).

### 2.3 Tenant selection at runtime

- **Build-time**: e.g. flavor or env var `CU_TENANT_ID=12345` for a single-CU build.
- **Runtime**: e.g. from deep link, QR code, or “choose your credit union” flow that then fetches `GET /api/config/{id}` and caches it.

---

## 3. BFF / API Adapter Contract (Any CU Backend)

So that the same Flutter app can work with **SunBlock, a custom BFF, or a Supabase Edge backend**, we define a **backend-agnostic contract**. The mobile app calls **one base URL per tenant** and uses a **single set of operation names and request/response shapes**. The backend (SunBlock, BFF, or Edge) is responsible for translating to the real core (Symitar/PowerOn, etc.).

### 3.1 Contract principles

1. **One base URL per tenant** — from config (`config.deploy.api` or `config.integrations.core.connection.endpoint`).
2. **Auth header** — e.g. `Authorization: Bearer {token}` or `X-Session-Token: {token}`. Exact name is configurable (e.g. `config.channels.mobile.auth_header`).
3. **REST or JSON-RPC** — either:
   - **REST**: `POST /v1/accounts`, `POST /v1/transfers/execute`, etc., with a stable path set, or
   - **JSON-RPC**: `POST /rpc` with `{ "method": "AccountList", "params": { ... } }`.
4. **Stable operation set** — the list in §1.4 defines the **logical operations**; the BFF can map them to SunBlock, PowerOn, or another core.

### 3.2 Minimal BFF contract (TypeScript)

See `lib/cu-mobile-bff-contract.ts`. It defines:

- **Base**: `getConfig(tenantId)`, `getSession()`, `apiBaseUrl(tenantId)`.
- **Auth**: `login(params)`, `logout()`, `refreshSession()`.
- **Operations**: `accountList()`, `accountTransactionList(accountId, ...)`, `transferExecute(from, to, amount, ...)`, `billPayGetHolidays()`, etc.

The Flutter app will implement a **CuApiClient** that uses this contract (same operation names and request/response DTOs) and calls the tenant’s base URL.

### 3.3 Backend implementers

- **SunBlock**: Existing WCF .svc; a thin BFF could proxy POSTs to SunBlock and translate path/body to the correct .svc operation.
- **Supabase + Edge**: Edge functions implement the same operation names and call Symitar/PowerOn or another core via your existing integration.
- **Custom BFF**: Any server that exposes the same contract and talks to the CU’s core.

---

## 4. cu_mx_app Production Checklist

- [ ] **Config**: On startup, load config from `GET {configBaseUrl}/api/config/{tenantId}` (configBaseUrl from env or build).
- [ ] **Branding**: App title, logo, primary color from config; no hardcoded “CU Banking” for production.
- [ ] **Feature flags**: Hide bill pay, RDC, etc. when `features.bill_pay` / `features.mobile_deposit` are false.
- [ ] **API client**: All data operations go through a single `CuApiClient` that uses tenant `api_base_url` and auth token.
- [ ] **Auth**: Login/logout and token storage; send token on every BFF request.
- [ ] **Tenant selection**: Support at least one of: build flavor, env var, or in-app “select CU” and fetch config.

Once the above are in place, **cu_mx_app** is a real production-ready app configured for any credit union, with the legacy SunBlock API catalog and multi-tenant config model documented here and a clear BFF contract for any backend to implement.
