---
name: cu-platform-unified
description: Applies legacy credit union production infrastructure context (platform-context.yaml) to deliver a unified member experience. Flutter member-facing app using cu_ui Dart design system only—never Material 3 or Google Material. Uses Supabase Edge Functions and cleansed transaction data in Supabase tables to avoid vendor lock-in (e.g. MX). Use when building or refactoring CU member apps, Flutter/cu_ui screens, Supabase schemas, or edge functions for transactions and PFM.
---

# CU Platform Unified Experience

## When to Use This Skill

- Building or refactoring the member-facing Flutter app (SunMobile successor, CU.APP).
- Designing or implementing Supabase tables, RLS, or Edge Functions for transactions, accounts, or PFM.
- Mapping legacy surfaces (Angular, Razor, M3, iframes) to a unified Flutter + Supabase experience.
- Avoiding third-party PFM/insights lock-in (e.g. MX) by computing and storing data in-house.

---

## 1. Legacy Infrastructure Context

**Source**: `platform-context.yaml` (often at project root or `~/Desktop/platform-context.yaml`). This file is the canonical description of:

- **Platform**: CU Digital Banking — member experience (banking.cu.com), advocate experience (M3), Backstage, platform-clutch.
- **Rendering mix**: Server-rendered Razor, Angular (e.g. SunNet ODP), iframes (PayRailz, Paymentus, **MX/MyInsights**, CUNexus, PrizeOut, DPC).
- **Surfaces**: 102+ screens, 49+ modals, 50+ wizard steps, 8 iframes; 209+ total surfaces.
- **Backend**: PowerOn specs (e.g. SCU.TRANSACTIONS.*), platform-transactions microservice, shared APIs.
- **Mobile**: SunMobile (Xamarin) — replacement target is Flutter + Supabase.

**Unified experience rule**: When adding or changing member-facing flows, check platform-context for existing sections, routes, and feature toggles. Preserve mental model (e.g. "Lock Something", account hierarchy) and map legacy routes/screens to Flutter + Supabase equivalents so the member gets one consistent experience instead of a patchwork of iframes and stacks.

---

## 2. Flutter Member App — cu_ui Only, No Material 3

- **UI stack**: Use the **cu_ui** Dart package only for the member-facing Flutter app. cu_ui is the Geist-inspired, tokenized design system for credit unions (see `cu-app-monorepo/cu_ui/`).
- **Do not use**: Material 3, Google Material design system, or Material You. No `material3: true`, no Material 3 widgets or theming as the primary UI.
- **Why**: Brand and UX consistency; avoiding Google Material dominance in a financial, member-facing product.
- **Reference**: `cu_ui` pubspec and `cu_ui/lib/` components. Use cu_ui tokens, themes, and components for all new member-facing screens.

---

## 3. Supabase: Tables and 700+ MCP Tables

- The project uses **Supabase** as the backend for the unified member app (PostgreSQL, Auth, PostgREST, Realtime, Edge Functions).
- There are **700+ tables** exposed via MCP (Supabase schema). When adding or changing tables:
  - Prefer aligning with existing schema and naming (e.g. `members`, `accounts`, `transactions`, tenant-scoped tables).
  - Use RLS so members see only their own data (`auth.uid()` or equivalent).
  - Prefer Supabase migrations under `supabase/migrations/` and document new tables in schema/docs if needed.
- When the agent needs table or column details, use the Supabase MCP tools/resources to inspect the current schema rather than guessing.

---

## 4. Edge Functions and Transaction Cleansing (Avoid MX Lock-in)

- **Prefer Edge Functions** for business logic that today might live in legacy services or third-party APIs: transfers, transaction enrichment, categorization, aggregation for PFM/insights.
- **Transaction cleansing**: Normalize and store transaction (and related) data in **Supabase tables** via Edge Functions or backend jobs. Cleanse once; serve from PostgREST/Realtime to the Flutter app. Do not rely on vendors like **MX (MyInsights)** for core transaction/insight data when it can be computed and stored in-house—this avoids per-member or per-call costs and lock-in.
- **Pattern**: Ingest from core/PowerOn or existing APIs → Edge Function (or job) cleanses/normalizes → write to Supabase tables → Flutter reads via Supabase client. Use Edge Functions for auth verification, side effects, and orchestration (see existing `supabase/functions/` e.g. `account-transfer`, `verify-auth`).
- **Reference**: `PRODUCT SPECS/CU_APP_SUPABASE_FLUTTER_REPLACEMENT.md` for legacy-vs-Supabase path and table examples (e.g. credit cards, transactions, business memberships).

---

## 5. Quick Reference

| Area | Use | Avoid |
|------|-----|--------|
| Member app UI | cu_ui (Flutter) | Material 3, Google Material |
| Backend / data | Supabase (PostgREST, RLS, Realtime) | Ad-hoc external APIs for core data |
| Business logic | Supabase Edge Functions | MX or other PFM APIs for data we can compute |
| Context | platform-context.yaml | Assuming legacy behavior without checking |
| Tables | Existing 700+ Supabase schema + migrations | New tables that duplicate or conflict with MCP schema |

---

## 6. File and Path Hints

- **Platform context**: `platform-context.yaml` (project root or user Desktop).
- **cu_ui package**: `cu-app-monorepo/cu_ui/` (or repo root `cu_ui/`).
- **Flutter app**: `cu-app-monorepo/mobile/`, `cu-app-monorepo/suncoast_app/suncoast/`.
- **Supabase**: `cu-app-monorepo/supabase/` (functions, migrations).
- **Replacement spec**: `PRODUCT SPECS/CU_APP_SUPABASE_FLUTTER_REPLACEMENT.md`.
