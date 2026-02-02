# Omnichannel Architecture - 21 Layers

## Complete Credit Union Omnichannel System

**Connects:** IVR (Genesys), Mobile, Web, Chat, Email, SMS, Push
**Routes Through:** 21-layer architecture
**Integrates:** Hume AI, Core Banking Adapters, Configuration Matrix

---

## The 21 Layers

### Layer 1: Channel Layer
**Entry Points:**
- Genesys IVR (with Hume AI)
- Twilio IVR
- Flutter Mobile App
- Next.js Web Portal
- Chat Widget (Hume AI)
- Email Service
- SMS Service
- Push Notifications

**Components:**
- Channel validators
- Input processors
- Channel-specific formatters

---

### Layer 2: Routing & Orchestration
**Purpose:** Intelligent routing and channel orchestration

**Components:**
- Hume EVI (Empathetic Voice Interface)
- Genesys Routing Engine
- Channel Router
- Session Manager
- Load Balancer

**Connections:**
- Receives from: Layer 1 (Channels)
- Routes to: Layer 3 (Auth), Layer 4 (Conversation)

---

### Layer 3: Authentication & Identity
**Purpose:** Multi-factor authentication, biometrics, device intelligence

**Components:**
- Auth0 Tenant Management
- Device Intelligence Service
- Biometric Verification
- PIN Verification Service
- OTP Service
- Multi-factor Authentication

**Connections:**
- Receives from: Layer 2 (Routing)
- Routes to: Layer 4 (Conversation), Layer 5 (AI)

---

### Layer 4: Conversation Management
**Purpose:** Conversation state, context, and session management

**Components:**
- Conversation Store (Supabase)
- Context Manager
- Session Handler
- State Machine
- UCID (Unique Call Identifier) Manager

**Connections:**
- Receives from: Layer 2 (Routing), Layer 3 (Auth)
- Routes to: Layer 5 (AI)

---

### Layer 5: AI & Natural Language
**Purpose:** Hume AI, speech recognition, intent understanding

**Components:**
- **Hume EVI** (Empathetic Voice Interface)
- Speech-to-Text (Twilio, Google)
- Intent Recognition
- Sentiment Analysis
- Voice Biometrics
- Natural Language Understanding

**Connections:**
- Receives from: Layer 4 (Conversation)
- Routes to: Layer 6 (Business Logic)

**Hume Integration:**
- Twilio Webhook: `https://api.hume.ai/v0/evi/twilio?config_id={configId}&api_key={apiKey}`
- Direct EVI API for chat/web
- Real-time emotion detection
- Intelligent routing based on sentiment

---

### Layer 6: Business Logic & Rules
**Purpose:** Business rules engine, workflow orchestration

**Components:**
- Rule Engine (from Configuration Matrix)
- Workflow Orchestrator
- Decision Engine
- Business Process Manager
- Feature Flags

**Connections:**
- Receives from: Layer 5 (AI)
- Routes to: Layer 7 (Adapters)

---

### Layer 7: Core Banking Adapters
**Purpose:** Universal adapter layer for all core systems

**Components:**
- **Symitar Adapter** (PowerOn/SymXchange)
- **Jack Henry Adapter** (Silverlake/jXchange)
- **Corelation Adapter** (KeyStone REST)
- **Fiserv Adapter** (DNA/XP2 SOAP)
- **Universal Adapter** (FDX 6.4 fallback)
- Adapter Registry
- Adapter Factory

**Connections:**
- Receives from: Layer 6 (Business Logic)
- Routes to: Layer 8 (Core Systems)

**Source:** `/Users/kylekusche/Desktop/quarentine/CU_APP_PRODUCT_ONE/adapters/`

---

### Layer 8: Core Banking Systems
**Purpose:** Direct connections to core banking systems

**Components:**
- Symitar/Episys (PowerOn Bridge)
- Jack Henry Silverlake
- Corelation KeyStone
- Fiserv DNA/XP2

**Connections:**
- Receives from: Layer 7 (Adapters)
- Returns data to: Layer 7 → Layer 9

**Real Connections:**
- SymXchange API endpoints
- jXchange API
- KeyStone REST API
- Fiserv SOAP/XML

---

### Layer 9: Data Transformation
**Purpose:** FDX compliance, data mapping, format conversion

**Components:**
- FDX Gateway Adapters (C#)
- Data Mapper
- Format Converter
- Schema Validator
- PowerOn Field Mapper

**Connections:**
- Receives from: Layer 7 (Adapters)
- Routes to: Layer 10 (Account Services)

---

### Layer 10: Account Services
**Purpose:** Account management, balances, transactions

**Components:**
- Account Service
- Balance Service
- Transaction Service
- Account Detail Service
- Account Ownership Service

**Connections:**
- Receives from: Layer 9 (Data Transformation)
- Routes to: Layer 11 (Transaction Services)

---

### Layer 11: Transaction Services
**Purpose:** Transfers, payments, bill pay, P2P

**Components:**
- Transfer Service
- Payment Service
- Bill Pay Service
- P2P Service
- ACH Service
- Stop Payment Service

**Connections:**
- Receives from: Layer 10 (Account Services)
- Routes to: Layer 12 (Loan Services), Layer 14 (Fraud)

---

### Layer 12: Loan Services
**Purpose:** Loan information, payments, applications

**Components:**
- Loan Service
- Loan Payment Service
- Loan Application Service
- Rate Service
- Loan Transaction Service

**Connections:**
- Receives from: Layer 11 (Transaction Services)
- Routes to: Layer 13 (Card Services)

---

### Layer 13: Card Services
**Purpose:** Card management, controls, transactions

**Components:**
- Card Service
- Card Control Service
- Card Transaction Service
- Card Activation Service

**Connections:**
- Receives from: Layer 12 (Loan Services)
- Routes to: Layer 14 (Fraud)

---

### Layer 14: Fraud & Risk
**Purpose:** Fraud detection, risk scoring, device intelligence

**Components:**
- Fraud Engine
- Risk Scorer
- Device Intelligence (PinDrop)
- Velocity Checks
- Geo-fencing
- Anomaly Detection

**Connections:**
- Receives from: Layer 13 (Card Services), Layer 11 (Transactions)
- Routes to: Layer 15 (Compliance)

---

### Layer 15: Compliance & Regulatory
**Purpose:** KYC, OFAC, Reg E, CTR, compliance checks

**Components:**
- KYC Service
- OFAC Checker
- Reg E Processor
- CTR Service
- Compliance Engine
- Audit Logger

**Connections:**
- Receives from: Layer 14 (Fraud)
- Routes to: Layer 16 (Notifications)

---

### Layer 16: Notification Services
**Purpose:** SMS, email, push notifications, alerts

**Components:**
- SMS Service (Twilio)
- Email Service
- Push Service
- Alert Service
- Notification Router

**Connections:**
- Receives from: Layer 15 (Compliance)
- Routes to: Layer 17 (Configuration)

---

### Layer 17: Configuration & Feature Flags
**Purpose:** Dynamic configuration, feature flags, A/B testing

**Components:**
- Config Service (Configuration Matrix)
- Feature Flags
- A/B Testing Engine
- Config Matrix Dashboard

**Connections:**
- Receives from: Layer 16 (Notifications)
- Routes to: Layer 18 (Analytics)

**Source:** Configuration Matrix in `/Users/kylekusche/Desktop/quarentine/configuration-matrix-build/`

---

### Layer 18: Analytics & Monitoring
**Purpose:** Real-time analytics, monitoring, logging

**Components:**
- Analytics Engine
- Monitoring Service
- Log Aggregator
- Metrics Collector
- APM (Application Performance Monitoring)

**Connections:**
- Receives from: Layer 17 (Configuration)
- Routes to: Layer 19 (Data Persistence)

---

### Layer 19: Data Persistence
**Purpose:** Database, cache, session storage

**Components:**
- Supabase (PostgreSQL)
- Redis Cache
- Session Store
- Data Warehouse
- Backup Service

**Connections:**
- Receives from: Layer 18 (Analytics)
- Routes to: Layer 20 (Integrations)

---

### Layer 20: Integration Services
**Purpose:** Third-party integrations, webhooks, APIs

**Components:**
- Webhook Router
- API Gateway
- Integration Hub
- Third-party Connectors
- External Service Adapters

**Connections:**
- Receives from: Layer 19 (Data Persistence)
- Routes to: Layer 21 (Infrastructure)

---

### Layer 21: Infrastructure & Deployment
**Purpose:** Cloud infrastructure, CI/CD, scaling

**Components:**
- Vercel (Next.js hosting)
- Supabase (Database)
- Azure Functions (Genesys IVR)
- Docker Containers
- Kubernetes
- CI/CD Pipeline (GitHub Actions)

**Connections:**
- Receives from: Layer 20 (Integrations)
- Final layer (deployment)

---

## Credit Union Operations

### All Operations Available Across All Channels:

1. **Account Balance Inquiry** - IVR, Mobile, Web, Chat
2. **Transfer Funds** - IVR, Mobile, Web, Chat
3. **Loan Information** - IVR, Mobile, Web, Chat
4. **Transaction History** - IVR, Mobile, Web, Chat
5. **Bill Pay** - Mobile, Web, Chat
6. **Card Management** - Mobile, Web, Chat
7. **PIN Change** - IVR, Mobile
8. **Stop Payment** - IVR, Mobile, Web
9. **Account Opening** - Mobile, Web
10. **Loan Application** - Mobile, Web

---

## Real Banking Connections

### Core Systems Connected:

1. **Symitar/Episys**
   - Protocol: PowerOn/SymXchange
   - Endpoints: SymXchange API
   - Adapter: `SymitarAdapter` from CU_APP_PRODUCT_ONE

2. **Jack Henry**
   - Protocol: jXchange API
   - Endpoints: Silverlake API
   - Adapter: `JackHenryAdapter` from CU_APP_PRODUCT_ONE

3. **Corelation**
   - Protocol: KeyStone REST API
   - Endpoints: REST endpoints
   - Adapter: `CorelationAdapter` from CU_APP_PRODUCT_ONE

4. **Fiserv**
   - Protocol: DNA/XP2 SOAP/XML
   - Endpoints: SOAP services
   - Adapter: `FiservAdapter` from CU_APP_PRODUCT_ONE

---

## Genesys IVR Integration

### IVR integration:
- **Location:** platform-genesys-ivr (external)
- **Controllers:**
  - `ConversationController` - Manages IVR conversations
  - `MembershipController` - Member operations (PIN, transfers, transactions, stop payments)
- **Services:**
  - `SymXChangeService` - Direct Symitar integration
  - `ValidationService` - Input validation
  - `UserViewProvider` - Member data provider

### Integration Points:
- UCID (Unique Call Identifier) management
- Member PIN verification
- Account operations
- Transfer processing
- Transaction queries
- Stop payment requests

---

## Hume AI Integration

### Configuration:
- **EVI Config ID:** `NEXT_PUBLIC_HUME_CONFIG_ID`
- **API Key:** `HUME_API_KEY`
- **Twilio Webhook:** `https://api.hume.ai/v0/evi/twilio?config_id={configId}&api_key={apiKey}`

### Features:
- Intent recognition
- Sentiment analysis
- Emotion detection
- Intelligent routing
- Natural language understanding

---

## File Structure

```
configuration-matrix-build/
├── components/
│   ├── omnichannel-architecture.tsx    # Main 21-layer view
│   └── omnichannel-live-view.tsx      # Live channel activity
├── app/api/
│   ├── omnichannel/
│   │   └── route.ts                    # Unified omnichannel API
│   └── ivr/
│       └── genesys/
│           └── route.ts               # Genesys IVR integration
├── lib/
│   ├── omnichannel-service.ts          # Omnichannel service client
│   ├── core-adapter-bridge.ts          # Core adapter bridge
│   └── hume-integration.ts             # Hume AI integration
└── OMNICHANNEL_ARCHITECTURE.md        # This file
```

---

## Usage

### In Configuration Matrix:
1. Navigate to **"Omnichannel"** in left sidebar
2. View all 21 layers of architecture
3. See all credit union operations
4. Monitor live channel activity
5. View real banking connections

### API Usage:
```typescript
import { omnichannelService } from "@/lib/omnichannel-service"

// IVR balance inquiry
const result = await omnichannelService.ivrBalanceInquiry("123456", "1234")

// Mobile transfer
const transfer = await omnichannelService.mobileTransfer(
  "123456",
  "S0001",
  "S0002",
  100.00
)

// Chat with Hume AI
const chat = await omnichannelService.chatInquiry("session-123", "What's my balance?")
```

---

## Status

✅ **21 Layers Defined** - All layers mapped and connected
✅ **Genesys IVR Integrated** - Routes through all layers
✅ **Hume AI Connected** - Intelligent routing and sentiment analysis
✅ **Core Adapters Bridged** - Symitar, Jack Henry, Corelation, Fiserv
✅ **All Operations Mapped** - 10 credit union operations across all channels
✅ **Real Banking Connections** - Live core system connections
✅ **Configuration Matrix UI** - Full dashboard in config build

---

**Everything is connected. Everything is real. Everything is clear as day.**
