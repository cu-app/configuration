# Loan Extension: Acceptance Criteria (CU.APP Whitelabel)

**Scope:** Feasible whitelabel of the existing M3/Episys loan extension flow to CU.APP.  
**Source of truth:** Loan Extension Decision Trace (LoanExtensionServices.cs, Episys PowerOn).

Acceptance criteria below define when the CU.APP whitelabel implementation is **done** and **aligned** with the current decision flow. Nothing here invents new behavior—only criteria to verify parity and feasibility.

---

## 1. Entry Points

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| E1 | **CU.APP entry points** | Loan extension can be submitted from at least one of: CU.APP mobile app, SunMobile-equivalent, or web (SunNet-equivalent). No requirement to support M3 staff system in v1. |
| E2 | **Single decision engine** | All entry points feed one decision path (auto-approve check → manual queue or apply). No divergent logic per channel beyond audit (channel/source). |

---

## 2. Auto-Approval (11 Rules)

The system **MUST** evaluate the same 11 rules as `GetLoanExtensionAutoApprovalDenialReason_Default()` (Trace lines 1522–1605). Auto-approve **only** when all rules pass (denial reason is null).

| ID | Rule | Criterion | Pass condition |
|----|------|-----------|----------------|
| A1 | Extension length | Configurable max extension days (e.g. 30). | If `extensionLength > configured max` → deny auto-approve with reason equivalent to "Extension length greater than extension length max". |
| A2 | Loan type | Only configured loan types eligible. | If loan type not in configured list (e.g. LoanExtensionAutoApproveTypes) → deny with "Loan type does not qualify for auto approval". |
| A3 | Close date | Loan must not have close date. | If `loan.CloseDate` present and > MinValue → deny with "Loan has close date". |
| A4 | Balance | Loan must have non-zero balance. | If balance = 0 → deny with "Loan has balance 0". |
| A5 | Payment count | Minimum payments made (e.g. 3). | If `loan.PaymentsMade < configured min` → deny with "Loan has less than 3 payments made". |
| A6 | Due date window | Due date within eligibility window (e.g. 30 days). | If (Today − payment due date).Days > configured window → deny with "Loan payment due date is greater than eligibility window". |
| A7 | Loan warnings | No loan-level warning codes 30, 31, 33. | If any of 30/31/33 present on loan → deny with "Loan has warning code of 30, 31 or 33". |
| A8 | Account warnings | No account-level warning codes 30, 31, 33. | If any of 30/31/33 at account level → deny with "Account has warning code of 30, 31 or 33". |
| A9 | Purpose code | Purpose code must not be 59, 84, or 85. | If purpose code in {59, 84, 85} → deny with "Loan purpose code of 59, 84 or 85". |
| A10 | Extension count | Max prior extensions (e.g. 3). | If `loanExtensionRequestCount >= configured max` → deny with "Loan extension count is equal or greater than 3". |
| A11 | Last extension date | Cooldown (e.g. 365 days). | If (Today − last extension approved date).Days ≤ 365 → deny with "Previous loan extension was completed less than 365 days". |

**Meta:**  
- AC **A0** (optional): All 11 rules are configurable per tenant (e.g. via cu-config / rules or Supabase) so a CU can tighten/loosen without code change.  
- When **all** rules pass → treat as auto-approve (DecisionId = AutoApproved) and proceed to apply (see §4).

---

## 3. Manual Decisions

When auto-approval is denied, the request goes to manual review. The system **MUST** support the same decision outcomes as the trace.

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| M1 | **Approve** | Staff can approve (DecisionId = Approved). Approved extension days and new due date are stored; then ApplyLoanExtension is called (see §4). |
| M2 | **Deny** | Staff can deny (DecisionId = Denied). A **valid** denial reason (from a maintained list) is required; DenialReasonId is stored; **no** call to ApplyLoanExtension. |
| M3 | **Counteroffer** | Staff can counteroffer (DecisionId = Counteroffer) with different days/terms; on acceptance, ApplyLoanExtension is called. |
| M4 | **Approve with stipulation** | Staff can approve with stipulation (DecisionId = ApprovedWithStipulation); DecisionStipulationsMet and optional MortgageServicingReviewComplete are stored; then apply. |
| M5 | **Denial reason list** | Denial reasons are configurable/listable and active/inactive. Deny action only accepts an active denial reason. |
| M6 | **Audit** | Each decision records DecisionBy, DecisionByName, DecisionDate (and where applicable ApprovedExtensionDays, NewDueDate, DenialReasonId, DecisionStipulationsMet, MortgageServicingReviewComplete). |

---

## 4. Apply to Core (Episys / PowerOn)

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| C1 | **Apply only when approved** | ApplyLoanExtension (or CU.APP equivalent) is invoked **only** for AutoApproved, Approved, Counteroffer, or ApprovedWithStipulation—**never** for Denied or DeniedNoResponse. |
| C2 | **Core parameters** | The call to core carries at least: member number, suffix, original due date, extended/advance date, days extended, submission note, and process type (e.g. AutoApproved vs manual). |
| C3 | **PowerOn / Episys** | When core is Episys, the flow uses the same PowerOn script as the trace: **ADVANCELOANDUEDATE** (SCU.MOBILEBANKING). Optional: LOANPROJECTION used for projection before apply, as in trace. |
| C4 | **Idempotency / errors** | If core apply fails, request status reflects failure (e.g. NeedManualReview) and the decision is still persisted; no silent loss of decision. |

---

## 5. Decision and Status Model

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| D1 | **Decision IDs** | The six outcomes are representable: None = 0, AutoApproved = 1, Approved = 2, Counteroffer = 3, ApprovedWithStipulation = 4, Denied = 5, DeniedNoResponse = 6. |
| D2 | **Decision payload** | Stored decision includes: DecisionId, DecisionBy, DecisionByName, DecisionDate, ApprovedExtensionDays, NewDueDate, DecisionStipulationsMet, MortgageServicingReviewComplete, DenialReasonId (when denied). |
| D3 | **Status** | Request status supports at least: New/pending review, Closed Complete (after apply or after deny), Need Manual Review (e.g. after failed apply). |

---

## 6. Configuration (Whitelabel / CU.APP)

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| F1 | **Per-tenant config** | Loan extension rules (max extension length, eligible loan types, eligibility window, min payments, extension count max, last-extension cooldown) are configurable per tenant (e.g. via cu-config or Supabase) so each CU can match their M3/appsettings. |
| F2 | **No hardcoding of M3 defaults** | Defaults may mirror appsettings.Production (e.g. LoanExtensionAutoApproveLength: 30, LoanExtensionEligibilityWindow: 30), but the **source** of values is config/database, not a single hardcoded file. |
| F3 | **Whitelabel** | Branding and copy (e.g. "Loan Extension", denial messages) can be tailored per tenant without code change (e.g. via content/config). |

---

## 7. Feasibility and Compliance

| ID | Criterion | Pass condition |
|----|-----------|----------------|
| V1 | **Trace parity** | The end-to-end flow (submit → auto-approve check → manual decisions → apply to core) matches the described trace behavior; no extra mandatory steps that block parity. |
| V2 | **1033 / ISO 20022 / FDX** | Where loan extension touches member data or reporting, behavior complies with existing 1033, ISO 20022, and FDX standards already adopted in the codebase (payment/onboarding/adapter modules). |
| V3 | **Existing components** | Reuse of existing CU.APP/Supabase/config and PowerOn/adapter layers is allowed; no duplicate auth, tenant, or core-integration stacks. |

---

## Summary Checklist

- **Entry:** At least one CU.APP channel can submit; one decision engine.
- **Auto-approve:** All 11 rules implemented and configurable; auto-approve only when all pass.
- **Manual:** Approve, Deny (with required denial reason), Counteroffer, Approve with stipulation; full decision audit.
- **Core:** Apply only for approved outcomes; PowerOn ADVANCELOANDUEDATE (and optional LOANPROJECTION); errors reflected in status.
- **Model:** Decision IDs 0–6; decision payload and status values as above.
- **Config:** Per-tenant rules and whitelabel; no hardcoded M3-only defaults.
- **Compliance:** Trace parity; 1033/ISO 20022/FDX where applicable; reuse existing stacks.

Document version: 1.0. Source: Loan Extension Decision Trace (M3/Episys).
