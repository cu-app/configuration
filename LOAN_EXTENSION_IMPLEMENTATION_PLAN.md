# Loan Extension: Implementation Plan (CU.APP Whitelabel)

Maps [LOAN_EXTENSION_ACCEPTANCE_CRITERIA.md](./LOAN_EXTENSION_ACCEPTANCE_CRITERIA.md) to actionable tasks. Order is dependency-aware; no new behavior beyond the AC.

---

## Phase 1: Config & Model (F1, F2, D1–D3)

| Task | AC | Description |
|------|----|-------------|
| 1.1 | F1, F2 | **Config** – `rules.loan_extension` is in cu-config (done in `types/cu-config.ts`). Ensure defaults are loaded from config/DB, not hardcoded. |
| 1.2 | D1–D3 | **Decision & status model** – Define types/enums: DecisionId (0–6), Decision payload (DecisionBy, DecisionDate, ApprovedExtensionDays, DenialReasonId, etc.), StatusId (New, Closed Complete, Need Manual Review). Persist in Supabase (e.g. `loan_extension_requests`, `loan_extension_denial_reasons`). |

---

## Phase 2: Auto-Approval Engine (A0–A11)

| Task | AC | Description |
|------|----|-------------|
| 2.1 | A1–A11 | **11 rules** – Implement `GetLoanExtensionAutoApprovalDenialReason` equivalent: for a given request + loan + config, evaluate each rule in order; return first denial reason or null. |
| 2.2 | A0 | **Per-tenant config** – Read `rules.loan_extension` (and optional overrides from Supabase) per tenant; no appsettings.Production in CU.APP. |
| 2.3 | E2 | **Single path** – On submit, call auto-approve check; if null → set DecisionId = AutoApproved and queue apply; else set status = New (manual review). |

---

## Phase 3: Manual Decisions (M1–M6)

| Task | AC | Description |
|------|----|-------------|
| 3.1 | M5 | **Denial reasons** – Table/API for list of denial reasons (active/inactive). Deny action requires active reason. |
| 3.2 | M1–M4, M6 | **Decision API** – Endpoints or actions: Approve, Deny (with DenialReasonId), Counteroffer, ApproveWithStipulation. Each writes Decision payload and audit fields; Approve/Counteroffer/Stipulation trigger apply (Phase 4). |

---

## Phase 4: Apply to Core (C1–C4)

| Task | AC | Description |
|------|----|-------------|
| 4.1 | C1, C2 | **Apply only when approved** – ApplyLoanExtension (or adapter) is called only for DecisionId 1, 2, 3, 4. Parameters: member number, suffix, original due date, advance date, days extended, note, process type. |
| 4.2 | C3 | **PowerOn** – When core is Episys, call ADVANCELOANDUEDATE (SCU.MOBILEBANKING). Optional: LOANPROJECTION before apply. |
| 4.3 | C4 | **Error handling** – On core failure, set request status to Need Manual Review; persist decision. |

---

## Phase 5: Entry Points & Whitelabel (E1, F3)

| Task | AC | Description |
|------|----|-------------|
| 5.1 | E1 | **Entry points** – At least one channel (mobile or web) can submit a loan extension request; same backend/decision engine. |
| 5.2 | F3 | **Whitelabel** – Labels and denial messages come from content/config per tenant. |

---

## Phase 6: Compliance & Parity (V1–V3)

| Task | AC | Description |
|------|----|-------------|
| 6.1 | V1 | **Trace parity** – E2E test or checklist: submit → auto-approve check → manual outcomes → apply; behavior matches trace. |
| 6.2 | V2 | **1033 / ISO 20022 / FDX** – Any member data or reporting in this flow follows existing compliance triggers in payment/onboarding/adapters. |
| 6.3 | V3 | **Reuse** – Use existing Supabase, cu-config, PowerOn/adapter layers; no duplicate auth or core stack. |

---

## Done Checklist

- [ ] Config: `rules.loan_extension` in use; no hardcoded M3 defaults.
- [ ] Model: Decision IDs 0–6, full decision payload, status values.
- [ ] Auto-approve: 11 rules implemented and configurable; single decision path.
- [ ] Manual: Approve / Deny (with reason) / Counteroffer / Stipulation; denial list; audit.
- [ ] Core: Apply only for approved outcomes; ADVANCELOANDUEDATE; errors → Need Manual Review.
- [ ] Entry: At least one channel; whitelabel copy per tenant.
- [ ] Parity & compliance: Trace-aligned; 1033/ISO 20022/FDX; reuse existing stacks.
