# CU.APP Configuration Matrix

**Config Over Code — One JSON File Powers Two Apps**

A comprehensive, white-labeled configuration platform that powers both the **Member Mobile App** (Flutter/Dart) and the **Employee Portal** (Next.js) for 4,300+ credit unions from a single JSON configuration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CU.APP CONFIGURATION MATRIX                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│   │   NCUA DB   │     │  Clearbit   │     │ App Store   │   DATA SOURCES   │
│   │  (CU Data)  │     │  (Logos)    │     │ (Reviews)   │                  │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                  │
│          │                   │                   │                          │
│          └───────────────────┼───────────────────┘                          │
│                              ▼                                              │
│                    ┌─────────────────┐                                      │
│                    │    Supabase     │                                      │
│                    │   (cu_configs)  │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│                    ┌────────▼────────┐                                      │
│                    │  Config Admin   │  ◄── You are here                   │
│                    │   Dashboard     │                                      │
│                    └────────┬────────┘                                      │
│                             │                                               │
│              ┌──────────────┼──────────────┐                                │
│              ▼              ▼              ▼                                │
│     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                        │
│     │   GitHub    │ │  Vercel CDN │ │  Webhooks   │   DISTRIBUTION         │
│     │  (CI/CD)    │ │  (JSON)     │ │  (Events)   │                        │
│     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                        │
│            │               │               │                                │
│            └───────────────┼───────────────┘                                │
│                            ▼                                                │
│         ┌──────────────────┴──────────────────┐                             │
│         │                                     │                             │
│    ┌────▼─────┐                         ┌────▼─────┐                        │
│    │  Member  │                         │ Employee │                        │
│    │   App    │                         │  Portal  │                        │
│    │ (Dart)   │                         │  (Web)   │                        │
│    └──────────┘                         └──────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The 15 Configuration Tiers

| Tier | Name | Fields | Purpose |
|------|------|--------|---------|
| 1 | **Identity & Brand** | 12 | Who is this CU? Name, charter, routing, domain |
| 2 | **Design Tokens** | 25 | How does it look? Colors, fonts, spacing, logos |
| 3 | **Feature Flags** | 35 | What's turned on? Mobile deposit, bill pay, P2P |
| 4 | **Product Config** | 50+ | What products exist? Shares, loans, cards |
| 5 | **Business Rules** | 45 | How does money move? Limits, holds, timeouts |
| 6 | **Fraud & Risk** | 25 | What triggers alerts? Velocity, geo, signals |
| 7 | **Compliance** | 25 | What's required? KYC, CTR, OFAC, Reg E |
| 8 | **Integrations** | 40 | What's connected? Core, processor, ACH |
| 9 | **Channels** | 30 | Where do members interact? iOS, Android, web |
| 10 | **Notifications** | 25 | What gets sent when? Login, transaction, fraud |
| 11 | **Content & Copy** | 20 | What does it say? Welcome message, terms, errors |
| 12 | **UCX** | 15 | How does it self-heal? Auto-fix, rollback |
| 13 | **AI Coaching** | 15 | How does the AI behave? Personality, proactive |
| 14 | **Deployment** | 20 | How does it run? Region, cache, logging |
| 15 | **PowerOn Specs** | 139 | Core banking integration specs |

**Total: 380+ configuration fields**

---

## Quick Start

### 1. Database Setup

The Supabase tables should already be created. If not:

```sql
-- Run: scripts/002-create-cu-config-tables.sql
```

### 2. Environment Variables

Required (already configured via Supabase integration):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Key Features

### Role-Based Access

| Role | Access Level |
|------|--------------|
| **CU Administrator** | Full platform control - all 15 tiers |
| **Member Advocate** | Member support, call center tools |
| **Developer** | API access, CI/CD, deployment |

### Data Sources

| Source | Purpose | Auto-Sync |
|--------|---------|-----------|
| NCUA Database | Charter #, assets, members, HQ | Quarterly |
| Clearbit | CU logos | On-demand |
| App Store Connect | iOS reviews & ratings | Hourly |
| Play Console | Android reviews & ratings | Hourly |
| GitHub | Config repo, CI/CD status | Real-time |

### Feature-to-Config Mapping

Every UI element in the member app maps to a config field:

```
Bug Report: "cant deposit check"
    ↓
Feature Tag: "mobile deposit", "rdc", "deposit check"
    ↓
Config Path: features.mobile_deposit
    ↓
Resolution: Set to `true` to enable
```

---

## API Endpoints

### Cron Jobs (Vercel)

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/sync-cu-data` | Quarterly | Pull NCUA data for all CUs |
| `/api/cron/config-sync` | Hourly | Validate configs, sync to CDN |
| `/api/cron/config-backup` | Daily | Backup all configs |

### Config Access

```typescript
// Fetch config for a CU
const { data } = await supabase
  .from('cu_configs')
  .select('config')
  .eq('tenant_id', 'cu_navyfed_001')
  .single()

// The config is a complete CreditUnionConfig object
const config: CreditUnionConfig = data.config
```

---

## File Structure

```
├── app/
│   ├── page.tsx                    # Main entry point
│   ├── rules/                      # Visual rule builder
│   └── api/cron/                   # Automated sync jobs
├── components/
│   ├── unified-platform.tsx        # Main dashboard shell
│   ├── cu-config-dashboard.tsx     # Config editor
│   ├── tier-editor.tsx             # Per-tier form editor
│   ├── config-field-mapping.tsx    # Field mapping view
│   ├── rule-builder/               # IFTTT-style rule builder
│   └── ui/                         # shadcn components
├── lib/
│   ├── credit-union-data.ts        # Top 20 CUs with real data
│   ├── cu-config-defaults.ts       # Default config template
│   ├── feature-config-mapping.ts   # Feature-to-field mapping
│   └── supabase/                   # Supabase clients
├── types/
│   ├── cu-config.ts                # Complete config type (380+ fields)
│   └── poweron-specs.ts            # PowerOn spec registry (139 specs)
├── scripts/
│   └── 002-create-cu-config-tables.sql  # Database schema
└── vercel.json                     # Cron job configuration
```

---

## Configuration Schema

Every credit union config follows this structure:

```typescript
interface CreditUnionConfig {
  tenant: TenantConfig          // Identity & brand
  tokens: DesignTokens          // Visual design
  features: FeatureFlags        // What's enabled
  products: ProductConfig       // Shares, loans, cards
  rules: BusinessRules          // Limits & restrictions
  fraud: FraudConfig            // Risk & alerts
  compliance: ComplianceConfig  // Regulatory requirements
  integrations: IntegrationConfig // Connected systems
  channels: ChannelConfig       // Member touchpoints
  notifications: NotificationConfig // Alerts & messages
  content: ContentConfig        // Copy & messaging
  ucx: UCXConfig                // Self-healing UX
  ai: AIConfig                  // AI coaching behavior
  deploy: DeployConfig          // Runtime configuration
  poweron: PowerOnConfig        // Core banking specs
}
```

---

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Add Supabase integration
3. Deploy

Cron jobs in `vercel.json` will auto-run on schedule.

### Manual

```bash
npm run build
npm start
```

---

## License

Proprietary - CU.APP Platform

---

## Support

- Platform Issues: [GitHub Issues]
- Integration Help: support@cu.app
- Emergency: Check connection status in Sources tab
```

```json file="" isHidden
