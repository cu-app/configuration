# Digital Banking Platform - Screen Architecture & Data Binding Map

## Overview

This document maps every UI element to its data source, enabling a "click-to-inspect" configuration experience.

**Pattern**: Select any element → Right panel shows data source controls (Symitar, Visa DPS, Alloy, etc.)

---

## I. MEMBER-FACING SCREENS (62+ surfaces)

### A. AUTHENTICATION (9 screens)

| Screen | Route | Elements | Data Source |
|--------|-------|----------|-------------|
| Login | `/auth/login` | Username input, PIN input, Remember device | `Symitar.Authentication` |
| MFA Selection | `/auth/mfa` | SMS button, Email button, Call button | `Symitar.MFA`, `Twilio` |
| MFA Code Entry | `/auth/mfa/verify` | Code input (6 digits), Resend link | `Symitar.MFA` |
| High-Risk Challenge | `/auth/mfa/high-risk` | Additional verification | `RiskDefense` |
| Device Check Failed | `/auth/device-failed` | New device warning | `Symitar.DeviceFingerprint` |
| Forgot PIN | `/auth/forgot-pin` | Email/Phone input | `Symitar.PINReset` |
| Reset PIN | `/auth/reset-pin` | New PIN input, Confirm PIN | `Symitar.PINReset` |
| Session Timeout | `/auth/timeout` | Warning modal, Continue button | `Session.Timeout` |
| Biometric Prompt | `/auth/biometric` | Face ID / Touch ID | `LocalAuth` |

---

### B. HOME / DASHBOARD

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Account Summary Tile | `AccountSummaryCard` | `Symitar.Shares`, `Symitar.Loans` | Show/hide account types, balance display format |
| Quick Actions | `QuickActionGrid` | `FeatureFlags` | Enabled actions, icon set, labels |
| Transfers Tile | `TransfersTile` | `Symitar.Transfers` | Recent count, quick transfer CTA |
| Pay Bills Tile | `BillPayTile` | `Paymentus` OR `PayRailz` | Provider toggle |
| CashBack+ Tile | `CashBackTile` | `PrizeOut` | Feature flag |
| Cards Tile | `CardsTile` | `Symitar.Cards`, `Visa.DPS` | Show credit/debit |
| Budget Tile | `BudgetTile` | `MX.Insights` | Feature flag |
| Messages Badge | `InboxBadge` | `Symitar.SecureMessaging` | Unread count |
| Offers Tile | `OffersTile` | `CUNexus` | Personalization level |

---

### C. ACCOUNTS (11 screens)

#### C1. Balances Overview (`/accounts`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Account Group Header | `AccountGroupHeader` | `Symitar.ShareTypes` | Group by: type, status, custom |
| Account Row | `AccountListItem` | `Symitar.Shares` | Fields: name, number, balance, available |
| Balance Display | `BalanceDisplay` | `Symitar.Shares.Balance` | Format: currency, hide cents |
| Available Balance | `AvailableBalance` | `Symitar.Shares.AvailableBalance` | Show/hide |
| Account Number | `AccountNumber` | `Symitar.Shares.AccountNumber` | Mask: last 4, full, none |
| Interest Rate | `InterestRate` | `Symitar.Shares.DividendRate` | Show APY/APR |
| Maturity Date | `MaturityDate` | `Symitar.Shares.MaturityDate` | CD/IRA only |

#### C2. Transaction History (`/accounts/history`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Transaction List | `TransactionList` | `Symitar.Transactions` | Date range, pagination |
| Transaction Row | `TransactionItem` | `Symitar.Transactions` | Fields: date, description, amount, running balance |
| Date Filter | `DateRangePicker` | Local | Presets: 30/60/90 days, custom |
| Search Input | `TransactionSearch` | `Symitar.Transactions.Search` | Search by: description, amount, check # |
| Check Image | `CheckImage` | `Symitar.CheckImages` | Front/back, zoom |
| Category Tag | `CategoryTag` | `MX.Categorization` | Auto-categorize toggle |
| Dispute Button | `DisputeAction` | `Symitar.Disputes` | Show for eligible transactions |

#### C3. Overdraft Protection (`/accounts/odp`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| ODP Status | `ODPStatusBadge` | `Symitar.ODP.Status` | Enrolled/Not Enrolled |
| Source List | `ODPSourceList` | `Symitar.ODP.Sources` | Reorderable |
| Add Source | `ODPAddSource` | `Symitar.ODP.EligibleAccounts` | Account picker |
| Disclosure | `DisclosureDialog` | `Compliance.ODPDisclosure` | Checkbox required |
| Remove All | `ODPRemoveConfirm` | `Symitar.ODP` | Confirmation required |

---

### D. TRANSFERS (4 screens)

#### D1. Internal Transfers (`/transfers`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| From Account | `AccountPicker` | `Symitar.Shares.Transferable` | Filter: checking, savings |
| To Account | `AccountPicker` | `Symitar.Shares.Transferable` | Exclude source |
| Amount Input | `CurrencyInput` | Local | Min/max from `Symitar.TransferLimits` |
| Frequency Picker | `FrequencyPicker` | Local | One-time, weekly, bi-weekly, monthly |
| Start Date | `DatePicker` | Local | Min: today, max: 1 year |
| End Date | `DatePicker` | Local | Required for recurring |
| Memo Field | `MemoInput` | Local | Max length: 50 |
| Review Summary | `TransferReview` | Local | All fields formatted |
| Submit Button | `SubmitTransfer` | `Symitar.Transfers.Create` | Confirmation modal |

#### D2. External Transfers A2A (`/transfers/external`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| External Account List | `ExternalAccountList` | `Symitar.ExternalAccounts` | Verified only |
| Add External Account | `AddExternalAccount` | `Symitar.ExternalAccounts.Add` | Micro-deposit flow |
| Routing Number | `RoutingInput` | `FedACH.Validation` | Real-time validation |
| Account Number | `AccountNumberInput` | Local | Confirm entry |
| Account Type | `AccountTypePicker` | Local | Checking/Savings |
| Verification Status | `VerificationBadge` | `Symitar.ExternalAccounts.Status` | Pending/Verified |
| Transfer Direction | `DirectionPicker` | Local | To Suncoast / From Suncoast |
| Hold Period Notice | `HoldNotice` | `Symitar.ExternalTransferHolds` | Days display |

#### D3. Pay a Person P2P (`/transfers/p2p`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Recipient Search | `RecipientSearch` | `Symitar.P2P.Recipients` | Phone/Email lookup |
| Add Recipient | `AddRecipient` | `Symitar.P2P.Recipients.Add` | Phone or Email |
| Recent Recipients | `RecentRecipients` | `Symitar.P2P.Recipients.Recent` | Last 5 |
| Amount Input | `CurrencyInput` | Local | Max from `Symitar.P2P.Limits` |
| Message Field | `P2PMessage` | Local | Optional, 100 chars |
| Send Button | `SendP2P` | `Symitar.P2P.Send` | Confirmation |

---

### E. BILL PAY (Provider-dependent)

#### E1. PayRailz Implementation

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Payee List | `PayRailz.PayeeList` | `PayRailz.Payees` | Sort: alpha, recent |
| Add Payee | `PayRailz.AddPayee` | `PayRailz.PayeeSearch` | Biller directory |
| Pay Amount | `PayRailz.PaymentAmount` | Local | Min $1 |
| Pay Date | `PayRailz.PaymentDate` | `PayRailz.DeliveryDates` | Earliest delivery |
| Payment History | `PayRailz.History` | `PayRailz.Payments` | Filter by status |
| Recurring Setup | `PayRailz.Recurring` | `PayRailz.RecurringPayments` | Frequency options |

#### E2. Paymentus Implementation

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Bill Center Tab | `Paymentus.BillCenter` | `Paymentus.Bills` | eBills enabled |
| Make Payment | `Paymentus.MakePayment` | `Paymentus.Payments` | Amount, date |
| Payment Methods | `Paymentus.PaymentMethods` | `Paymentus.FundingSources` | Default source |
| Activity Tab | `Paymentus.Activity` | `Paymentus.PaymentHistory` | Date range |

---

### F. CARDS (8 screens)

#### F1. Card Overview (`/cards`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Credit Card Section | `CreditCardList` | `Symitar.CreditCards` | Show closed toggle |
| Debit Card Section | `DebitCardList` | `Symitar.DebitCards` | Show closed toggle |
| Card Image | `CardImage` | `CardAssets.Images` | Card art by type |
| Card Number (masked) | `MaskedCardNumber` | `Symitar.Cards.Number` | Last 4 digits |
| Card Status | `CardStatusBadge` | `Visa.DPS.CardStatus` | Active/Locked/Closed |
| Lock Toggle | `CardLockToggle` | `Visa.DPS.CardLock` | Real-time sync |
| Balance (Credit) | `CreditCardBalance` | `Symitar.CreditCards.Balance` | Current, statement, available |
| Min Due (Credit) | `MinimumDue` | `Symitar.CreditCards.MinDue` | Amount, due date |
| Credit Limit | `CreditLimit` | `Symitar.CreditCards.Limit` | Total, available |

#### F2. Lock/Unlock Confirmation (Modal)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Lock Warning | `LockWarningText` | `Content.CardLockWarning` | Customizable text |
| Exception List | `LockExceptions` | `Content.LockExceptions` | Auto-payments note |
| Confirm Button | `ConfirmLockAction` | `Visa.DPS.UpdateCardLock` | POST action |
| Cancel Button | `CancelAction` | Local | Close modal |

#### F3. Travel Notifications (`/cards/travel`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Travel Date Range | `TravelDatePicker` | Local | Start/end dates |
| Destination Country | `CountryPicker` | `Compliance.TravelCountries` | Blocked countries |
| Card Selection | `TravelCardSelect` | `Symitar.Cards.Active` | Multi-select |
| SMS Confirmation | `TravelSMSConfirm` | `Twilio.SMS` | Confirmation message |

---

### G. DOCUMENTS (5 screens)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Statement List | `StatementList` | `Symitar.Statements` | By account, date range |
| Statement PDF | `PDFViewer` | `Symitar.Statements.PDF` | Download, print |
| eNotice List | `ENoticeList` | `Symitar.ENotices` | Categories |
| Tax Document List | `TaxDocumentList` | `Symitar.TaxDocuments` | By year |
| Delivery Preferences | `DeliveryPrefs` | `Symitar.EStatementEnrollment` | Paper/electronic toggle |

---

### H. PROFILE (1 screen, multiple sections)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Contact Info | `ContactInfo` | `Symitar.Member.Contact` | Phone, email |
| Mailing Address | `MailingAddress` | `Symitar.Member.Address` | USPS validation |
| Email Preferences | `EmailPrefs` | `Symitar.Member.EmailPrefs` | Marketing opt-in |
| Password Change | `PasswordChange` | `Symitar.Authentication` | Complexity rules |
| PIN Change | `PINChange` | `Symitar.Authentication` | 4-digit |
| Username Change | `UsernameChange` | `Symitar.Authentication` | Availability check |
| Security Questions | `SecurityQuestions` | `Symitar.Authentication` | Question pool |

---

### I. FINANCIAL INSIGHTS - MX (`/insights`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Spending Chart | `MX.SpendingChart` | `MX.Transactions` | Categories |
| Budget Progress | `MX.BudgetProgress` | `MX.Budgets` | Monthly |
| Connected Accounts | `MX.ConnectedAccounts` | `MX.Connections` | External institutions |
| Add Account | `MX.AddConnection` | `MX.Institutions` | Institution search |
| Insights Cards | `MX.InsightCards` | `MX.Insights` | AI recommendations |

---

### J. CASHBACK+ (`/cashback`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Retailer Grid | `PrizeOut.RetailerGrid` | `PrizeOut.Retailers` | Categories |
| Cashback Rate | `PrizeOut.CashbackRate` | `PrizeOut.Offers` | Percentage display |
| Redeem Button | `PrizeOut.RedeemAction` | `PrizeOut.Redemption` | Gift card delivery |
| Balance Display | `PrizeOut.Balance` | `PrizeOut.MemberBalance` | Points/dollars |

---

### K. OFFERS (`/offers`)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Offer Cards | `CUNexus.OfferCard` | `CUNexus.Offers` | Personalized |
| Pre-Approved Badge | `CUNexus.PreApproved` | `CUNexus.PreApprovals` | Rate display |
| Apply Button | `CUNexus.ApplyAction` | `CUNexus.Applications` | Redirect to app |

---

## II. STAFF-FACING SCREENS (115+ surfaces)

### A. LOBBY & CALL HANDLING

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Phone Match List | `PhoneMatchList` | `Genesys.CallerID`, `Symitar.Members` | ANI lookup |
| Member Search | `MemberSearchForm` | `Symitar.Members.Search` | Fields: member#, SSN, card#, name |
| Search Results | `MemberSearchResults` | `Symitar.Members` | Card layout |
| Verification Panel | `VerificationPanel` | `Symitar.MFA`, `RiskDefense` | SMS, OOW questions |
| Call Banner | `CallBanner` | `Genesys.ActiveCall` | Duration, UCID, caller ID |

### B. DEBIT CARDS (22 components)

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Card Accordion | `DebitCardAccordion` | `Symitar.DebitCards` | Expandable |
| Card Info Tab | `CardInfoTab` | `Symitar.DebitCards`, `Visa.DPS` | All fields |
| Card Number | `FullCardNumber` | `Symitar.DebitCards.Number` | Staff-only unmasked |
| POS Limit | `POSLimitEditor` | `Symitar.DebitCards.POSLimit` | Editable |
| ATM Limit | `ATMLimitEditor` | `Symitar.DebitCards.ATMLimit` | Editable |
| PIN Fail Count | `PINFailCount` | `Symitar.DebitCards.PINFail` | Reset action |
| PIN Offset | `PINOffset` | `Symitar.DebitCards.PINOffset`, `Visa.DPS` | Reset + Visa sync |
| Access Sources | `AccessSourcesList` | `Symitar.DebitCards.Sources` | Account permissions |
| Lock Action | `LockUnlockAction` | `Visa.DPS.UpdateCardLock` | Same API as member |
| Block & Reorder | `BlockReorderWizard` | `Symitar.DebitCards.Block`, `Visa.DPS` | Multi-step |
| Card Notes | `CardNotesPanel` | `Symitar.DebitCards.Notes` | CRUD |

### C. ACCOUNTS / QUICK TRANSFER

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Transfer Stepper | `TransferStepper` | Local | 4 steps |
| Source Account | `StaffAccountPicker` | `Symitar.Shares` | All member accounts |
| Destination Account | `StaffAccountPicker` | `Symitar.Shares` | All member accounts |
| Cash Advance Warning | `CashAdvanceNotice` | `Compliance.CashAdvance` | Credit card source |
| Mortgage Payment Type | `MortgagePaymentType` | `Symitar.Mortgages` | Principal/Interest/Escrow |

### D. ACCOUNT MAINTENANCE

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Courtesy Pay Toggle | `CourtesyPayToggle` | `Symitar.CourtesyPay` | Per-type: ACH, POS, checks |
| ODP Management | `ODPManagement` | `Symitar.ODP` | Same as member + signature |
| Beneficiaries | `BeneficiaryManager` | `Symitar.Beneficiaries` | CRUD + validation |
| Joint Owners | `JointOwnerManager` | `Symitar.JointOwners` | Add/remove + signatures |
| Contact Info Edit | `ContactInfoEditor` | `Symitar.Member.Contact`, `USPS` | Address validation |
| TCPA Disclosure | `TCPADisclosure` | `Compliance.TCPA` | Checkbox consent |
| Password Reset | `PasswordResetTool` | `Symitar.Authentication` | Staff override |

### E. NEW MEMBERSHIP WIZARD (15+ steps)

| Step | Component | Data Source | Config Options |
|------|-----------|-------------|----------------|
| Product Selection | `ProductGrid` | `Symitar.Products` | Eligible products |
| Disclosures | `DisclosureAcceptance` | `Compliance.MembershipDisclosures` | Required checkboxes |
| Contact Form | `NewMemberContact` | Local → `Symitar.Members` | Phone, email, address |
| TCPA Consent | `TCPAConsent` | `Compliance.TCPA` | Required |
| Identity Verification | `IdentityVerification` | `Alloy`, `RiskDefense`, `RiskView` | Fraud check |
| Service Level | `ServiceLevelAssignment` | `Symitar.ServiceLevels` | Tier assignment |
| Joint Owners | `JointOwnerStep` | `Symitar.JointOwners` | Add joints |
| Beneficiaries | `BeneficiaryStep` | `Symitar.Beneficiaries` | Add beneficiaries |
| Funding | `FundingStep` | `Symitar.Funding` | Source, amount |
| ODP Setup | `ODPSetupStep` | `Symitar.ODP` | Source selection |
| Debit Card | `DebitCardStep` | `Symitar.DebitCards` | Instant/Mail/None |
| W-8 Signature | `W8SignatureStep` | `Compliance.W8BEN`, `Topaz` | Tax certification |
| Review | `ApplicationReview` | Local | All fields summary |
| Book Product | `BookProduct` | `Symitar.Products.Book` | Core submission |
| Signature Card | `SignatureCardCapture` | `OnBase`, `Topaz` | Physical signature |

### F. REFERRALS

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Referral Table | `ReferralTable` | `Symitar.Referrals` | Sortable, paginated |
| Create Referral | `CreateReferralForm` | `Symitar.Referrals.Create` | Category, contact |
| Owner Assignment | `OwnerAssignment` | `Symitar.Referrals.Owners` | Transfer ownership |
| Referral Status | `ReferralStatusEditor` | `Symitar.Referrals.Status` | Workflow states |

### G. ADMIN

| Element | Component | Data Source | Config Options |
|---------|-----------|-------------|----------------|
| Loan Extension Dashboard | `LoanExtensionDashboard` | `Symitar.LoanExtensions` | Search, filter |
| Extension Details | `ExtensionDetails` | `Symitar.LoanExtensions` | Tabs: Request, Owner, Decisioning, History |
| Status Change | `StatusChangeDialog` | `Symitar.LoanExtensions.Status` | Allowed transitions |
| Decisioning Edit | `DecisioningEditor` | `Symitar.LoanExtensions.Decision` | Approve/Deny |

---

## III. DATA SOURCE CONFIGURATION PANELS

When an element is selected, the right panel shows these configuration options:

### Symitar Configuration

```yaml
Symitar:
  Connection:
    Host: tunnel://tenant_id
    Environment: production | staging | sandbox
    Timeout: 30000ms
    Retry: 3
  
  Authentication:
    Method: SOAP | REST
    Credentials: Vault reference
    MFA:
      SMS: Twilio
      Email: SendGrid
      Voice: Twilio
  
  Shares:
    Endpoint: /shares
    Fields:
      - ShareId
      - ShareType
      - Description
      - Balance
      - AvailableBalance
      - DividendRate
      - MaturityDate
    Mapping:
      accountId: ShareId
      balance: Balance / 100  # Cents to dollars
      
  DebitCards:
    Endpoint: /debitcards
    VisaSync: true
    Fields: [...]
    
  Transactions:
    Endpoint: /transactions
    Pagination: true
    MaxRecords: 500
    DateRange: 2 years
```

### Visa DPS Configuration

```yaml
Visa.DPS:
  Connection:
    Endpoint: https://api.visa.com/dps
    ClientId: env.VISA_CLIENT_ID
    ClientSecret: env.VISA_CLIENT_SECRET
    
  CardLock:
    Endpoint: /cards/{cardId}/lock
    Method: PUT
    SyncWithSymitar: true
    
  RealTimeAlerts:
    Webhook: /webhooks/visa
    Events:
      - CARD_USED
      - CARD_DECLINED
      - FRAUD_ALERT
```

### Alloy Configuration

```yaml
Alloy:
  Connection:
    Endpoint: https://api.alloy.co
    Token: env.ALLOY_TOKEN
    
  IdentityVerification:
    Workflow: standard_kyc
    RequiredDocuments: false
    SelfieRequired: false
    
  FraudCheck:
    DenyThreshold: 0.8
    ReviewThreshold: 0.5
    AutoApproveThreshold: 0.2
```

### MX Configuration

```yaml
MX:
  Connection:
    Endpoint: https://api.mx.com
    ClientId: env.MX_CLIENT_ID
    ApiKey: env.MX_API_KEY
    
  SSO:
    Method: JWT
    TokenExpiry: 3600
    
  Features:
    Budgets: true
    Goals: false
    Insights: true
    Aggregation: true
```

---

## IV. IMPLEMENTATION ORDER

### Phase 1: Authentication Flow
1. Login screen
2. MFA screens
3. Session management

### Phase 2: Dashboard & Navigation
1. Home dashboard
2. Navigation shell
3. Account summary

### Phase 3: Accounts Module
1. Balances overview
2. Transaction history
3. ODP management

### Phase 4: Transfers Module
1. Internal transfers
2. External transfers (A2A)
3. P2P transfers

### Phase 5: Cards Module
1. Card overview
2. Lock/Unlock flow
3. Travel notifications

### Phase 6: Bill Pay Integration
1. PayRailz iframe
2. Paymentus iframe
3. Provider toggle

### Phase 7: Documents & Profile
1. Statement viewer
2. Profile management

### Phase 8: Third-Party Integrations
1. MX (MyInsights)
2. CUNexus (Offers)
3. PrizeOut (CashBack+)

---

## V. FILE STRUCTURE

```
lib/
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── mfa_screen.dart
│   │   └── ...
│   ├── dashboard/
│   │   └── dashboard_screen.dart
│   ├── accounts/
│   │   ├── accounts_screen.dart
│   │   ├── transaction_history_screen.dart
│   │   └── odp_screen.dart
│   ├── transfers/
│   │   ├── internal_transfer_screen.dart
│   │   ├── external_transfer_screen.dart
│   │   └── p2p_screen.dart
│   ├── cards/
│   │   ├── cards_screen.dart
│   │   ├── card_lock_modal.dart
│   │   └── travel_notifications_screen.dart
│   └── ...
├── components/
│   ├── account_list_item.dart
│   ├── transaction_item.dart
│   ├── card_image.dart
│   ├── currency_input.dart
│   └── ...
├── services/
│   ├── symitar_service.dart
│   ├── visa_dps_service.dart
│   ├── alloy_service.dart
│   ├── mx_service.dart
│   └── ...
└── config/
    ├── data_bindings.dart
    └── feature_flags.dart
```
