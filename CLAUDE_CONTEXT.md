# Claude Context - Configuration Matrix Build

## Project Overview

**What This Is:**
A configuration-as-product platform for credit unions. Instead of deploying 54 modules + 387 tables per CU, we deploy ONE app + ONE config JSON per tenant. The config editor is the product.

**Value Prop:**
- 4,300 credit unions × $10K/year subscription = $43M ARR potential
- Hours to configure (not months to customize)
- Zero vendor lock-in (vendor-agnostic integration slots)
- No code changes for customization

**Tech Stack:**
- **Frontend:** Next.js 16 (Turbopack), React, TypeScript, Tailwind
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Mobile:** Flutter + cu_ui design system (NO Material widgets)
- **Deployment:** Vercel (main app + Flutter preview)
- **Core Banking:** PowerOn (Symitar) integrations

---

## Architecture

### Simple Flow
```
User edits config → Saves to Supabase → Publishes to GitHub/CDN → Apps fetch config
```

### Distribution Pipeline
1. **Supabase** - Source of truth for all configs
2. **GitHub** - Auto-commit config.json to `{charter}-mobile-app` repos
3. **CDN** - Vercel Blob Storage for fast global access
4. **Webhooks** - Notify apps when config changes
5. **Apps** - Fetch via `GET /api/config/{tenantId}`

### Key Files
- `components/unified-platform.tsx` - Main app shell with collapsible sidebar
- `components/cu-config-dashboard.tsx` - 16-tier configuration editor
- `components/flutter-preview-simple.tsx` - Flutter preview component
- `app/api/publish/route.ts` - Distribution orchestration
- `lib/github-sync.ts` - GitHub auto-commit
- `lib/cdn-upload.ts` - CDN upload
- `lib/webhooks.ts` - Webhook notifications

---

## Configuration Structure (16 Tiers)

1. **Identity & Brand** - Name, charter, logo, colors, contact info
2. **Design Tokens** - Colors, typography, spacing, radius (cu_ui design system)
3. **Feature Flags** - Mobile deposit, bill pay, P2P, card controls, biometrics, etc.
4. **IVR & Voice** - Hume EVI voice banking (AI-powered phone banking)
5. **Product Configuration** - Checking, savings, loans, credit cards
6. **Business Rules** - Transfer limits, session timeout, password requirements
7. **Fraud & Risk** - Real-time scoring, velocity checks, geolocation
8. **Compliance** - BSA/AML, OFAC, CIP, Reg E/D/CC
9. **Integrations** - Core banking (Symitar/Fiserv), card processors, payment networks
10. **Channels** - Mobile (iOS/Android), web, IVR, chatbot
11. **Notifications** - Security alerts, transaction alerts, balance alerts
12. **Content & Copy** - App name, tagline, welcome messages, error messages
13. **UX** - User experience settings, consent dialogs, feedback collection
14. **AI Coaching** - Financial wellness AI coach configuration
15. **Deployment** - Environment, CDN, database, cache, logging
16. **PowerOn Specs** - 18 Symitar stored procedures with tenant prefixes (e.g., NFCU.MBRGRAPH.BYID.PRO)

---

## UI Structure

### Navigation (Left Sidebar)
- **Configuration** (DEFAULT HOME) - Exhaustive 16-tier editor
- **App Preview** - Pure Flutter preview (no editing)
- **CU Gallery** - All 4,300+ credit unions
- **Status** - Overview dashboard
- **CU Profile** - Credit union details
- **CU Network** - Social feed
- **Data Discovery** - AI-powered data enrichment
- **Field Mapping** - PowerOn → App config mapping
- **Design Tokens** - cu_ui design system tokens
- **App Reviews** - App Store reviews
- **Member Support** - Support queue
- **GitHub CI/CD** - GitHub sync status
- **Rule Builder** - Visual business rules
- **Data Sources** - Connected integrations

### Sidebar Features
- **Collapsible** - Collapse to icons-only (w-16) or expand (w-56)
- **CU Selector** - Dropdown with search for 4,300+ credit unions
- **Background Jobs** - Shows discovery tasks (enrichment, branches, logos, etc.)
- **Dark Mode** - Toggle light/dark theme

---

## Key Design Decisions

### ✅ What We Built
- **16-tier configuration editor** with nested forms
- **Flutter preview** using hosted cu_ui components (NOT DartPad)
- **Distribution pipeline** (Supabase → GitHub → CDN → Webhooks)
- **Collapsible sidebar** with icons-only mode
- **PowerOn spec generator** with tenant-specific prefixes
- **GitHub auto-commit** on publish
- **Public config API** for apps to fetch

### ❌ What We Deleted (Over-Engineering)
- Loan decision trace/extension system
- 18 granular feature flags (use JSON config instead)
- 3822 CU prefix generator (only ~20 active CUs)
- Pricing tiers (this is one-time purchase, not subscription)

### 🎯 Core Principles
1. **Configuration is the product** - Not the banking platform itself
2. **Vendor-agnostic** - Integration slots, not vendor lock-in
3. **No code changes** - All customization via config
4. **No overlap** - Configuration tab = editing, App Preview = viewing only
5. **No over-engineering** - Build only what's needed

---

## User Preferences & Style

### Communication Style
- **Concise and direct** - No fluff, no over-explanation
- **ALL CAPS for emphasis** - "MAKE SURE NO OVERLAP", "HOW HOW HOW"
- **Action-oriented** - "RUN IT", "test it", "DO THIS TOO"
- **No subscription pricing** - One-time purchase behind Stripe gate
- **Focus on app configuration** - Not platform pricing

### Technical Preferences
- **Real Flutter with cu_ui** - NO Material widgets
- **Pure cu_ui components** - CuLoginScreen, CuDashboardScreen, CuTheme, etc.
- **Exhaustive configuration** - All 16 sections fully built out
- **GitHub integration** - Auto-commit config.json on publish
- **Collapsible UI** - Icon-only mode for sidebar

### What Annoys User
- ❌ Proposing pricing models (already corrected once)
- ❌ Building features not explicitly requested
- ❌ Over-engineering simple things
- ❌ Not testing/running code immediately

---

## Current State (as of 2026-01-25)

### ✅ What's Working
- Next.js dev server running on localhost:3000
- Configuration tab as default home page
- 16-tier exhaustive configuration editor
- App Preview tab with Flutter preview (needs deployment)
- Collapsible sidebar (icons-only mode)
- Distribution pipeline fully wired up
- GitHub sync implemented (needs GITHUB_TOKEN in .env.local)
- CDN upload implemented (needs BLOB_READ_WRITE_TOKEN)
- Webhook system implemented
- Public config API at `/api/config/{tenantId}`
- Publish button in Configuration tab

### 🚧 What Needs Setup
1. **GitHub Token** - Add to `.env.local` for GitHub publishing
2. **Vercel Blob Token** - Add to `.env.local` for CDN uploads
3. **Flutter Preview Deploy** - Build and deploy flutter-preview to Vercel
4. **Webhook Endpoints** - Register webhook URLs in Supabase

### 📋 What's Next
- Deploy Flutter preview to Vercel
- Test full publish pipeline with GitHub
- Add authentication (Supabase Auth)
- Build marketing CMS features (later)

---

## Environment Variables

Required in `.env.local`:
```bash
# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# GitHub Publishing (needs to be added)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# CDN Upload (needs to be added)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# Flutter Preview URL (after deployment)
NEXT_PUBLIC_FLUTTER_PREVIEW_URL=https://flutter-preview-xxx.vercel.app
```

---

## Common Commands

### Development
```bash
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Build for production
npm run lint                   # Run ESLint
```

### Flutter Preview
```bash
cd flutter-preview
flutter pub get                # Install dependencies
./build.sh                     # Build for web
vercel deploy build/web --prod # Deploy to Vercel
```

### API Testing
```bash
# Fetch config for a tenant
curl http://localhost:3000/api/config/5536 | jq '.'

# Check publish status
curl "http://localhost:3000/api/publish?tenantId=5536" | jq '.'
```

---

## Database Schema (Supabase)

### Key Tables
- **`cu_configs`** - Main config storage (JSONB per tenant)
- **`cu_config_history`** - Version history and audit trail
- **`cu_themes`** - Brand colors and design tokens
- **`ncua_credit_unions`** - 4,300+ credit union metadata
- **`cu_poweron_prefixes`** - PowerOn spec prefixes per tenant

---

## Flutter Preview Architecture

### Problem
DartPad can't load external images (logos) due to security restrictions.

### Solution
Host real Flutter web app separately, pass config via URL params.

### Flow
```
FlutterPreview component → Builds URL with params → Loads in iframe
  ↓
https://flutter-preview.vercel.app?name=Navy%20Federal&logo=https://...&color=003366
  ↓
Flutter app reads URL params → Applies branding → Shows Splash → Login → Dashboard
```

### Deployment
```bash
cd flutter-preview
flutter build web --release --web-renderer canvaskit
vercel deploy build/web --prod
```

---

## Notes for Claude

- User prefers **direct answers** and **immediate action** over explanations
- Always **test/run code** when user says "RUN IT" or "test it"
- **No pricing discussions** unless explicitly asked
- **Configuration is the product** - keep focused on config editor
- When building features, **check for overlap** and keep concerns separated
- User uses **emphatic language** (CAPS, repetition) when something is important
- **Read existing code** before proposing changes
- **Avoid over-engineering** - build minimal viable features

---

## Quick Reference

**Main entry point:** `app/page.tsx` → `components/unified-platform.tsx`

**Configuration editor:** `components/cu-config-dashboard.tsx` + `components/tier-editor.tsx`

**Flutter preview:** `components/flutter-preview-simple.tsx` → `flutter-preview/` (separate app)

**Distribution pipeline:** `app/api/publish/route.ts` → `lib/github-sync.ts`, `lib/cdn-upload.ts`, `lib/webhooks.ts`

**Config fetch API:** `app/api/config/[tenantId]/route.ts`

**Architecture docs:** `SIMPLE_ARCHITECTURE.md`, `PLAN.md` (from plan mode)
