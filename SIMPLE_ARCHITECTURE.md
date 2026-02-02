# Simple Architecture (No Fluff)

## What Actually Matters

```
User edits config → Saves to Supabase → Publishes to GitHub/CDN → App reads config
```

That's it.

## Core Files

### 1. Configuration Schema
**`types/unified-config.ts`** - The ONE config file
- Identity & Brand
- Products & Rates
- Channels (mobile, web, IVR)
- Marketing content
- Security settings
- Integrations (vendor-agnostic)
- Business rules
- AI settings

### 2. Config Studio (UI)
**`app/config-studio/page.tsx`** - Edit + Preview + Publish
- Form editor for all fields
- Flutter preview (real cu_ui components)
- Save to Supabase
- Publish to GitHub

### 3. Flutter Preview (Real)
**`flutter-preview/`** - Hosted Flutter web app
- Uses `cu_ui` components (no Material)
- Reads config from URL params
- Shows: Splash → Login → Dashboard
- Deploy to Vercel

### 4. APIs
**`app/api/config/[tenantId]/route.ts`** - Get config for apps
**`app/api/publish/route.ts`** - Push to GitHub/CDN
**`app/api/tenant/prefix/route.ts`** - Tenant prefix lookup (NFCU, SCU, etc.)

### 5. Database
**Supabase tables:**
- `cu_configs` - JSONB config per tenant
- `cu_config_history` - Version history
- `cu_themes` - Branding/colors
- `ncua_credit_unions` - CU metadata
- `cu_poweron_prefixes` - PowerOn spec prefixes

## What We Deleted

❌ **Loan extension decision engine** - Over-engineered, not core
❌ **18 feature flags system** - Too granular, use JSON config
❌ **3822 CU prefix generator** - You have 20 CUs max
❌ **Loan decision trace UI** - Just a visualization

## Deployment

```bash
# 1. Deploy Flutter preview
cd flutter-preview
flutter build web --release
vercel deploy build/web --prod

# 2. Set env var in main app
NEXT_PUBLIC_FLUTTER_PREVIEW_URL=https://flutter-preview-abc123.vercel.app

# 3. Deploy main app
vercel deploy --prod
```

## Usage Example

```typescript
// Config Studio - Edit and publish
import ConfigStudio from '@/app/config-studio/page';

// Show preview with tenant config
import { FlutterPreview } from '@/components/flutter-preview-simple';

<FlutterPreview
  cuName={config.identity.legal_name}
  logoUrl={config.identity.brand.logo.primary}
  primaryColor={config.identity.brand.colors.primary}
/>
```

## Logo in Flutter Preview (SOLVED)

**Problem**: DartPad can't load external images
**Solution**: Host real Flutter web app, pass logo URL via params

```dart
// flutter-preview/lib/main.dart
final logoUrl = Uri.base.queryParameters['logo'];

Image.network(logoUrl)  // ← WORKS because it's hosted, not DartPad
```

The Flutter app reads `?logo=https://...` and displays it. No URL size limit. No security restrictions.

## Next Steps

1. Build Flutter preview: `cd flutter-preview && ./build.sh`
2. Deploy to Vercel: `vercel deploy build/web --prod`
3. Update `NEXT_PUBLIC_FLUTTER_PREVIEW_URL` in main app
4. Use `<FlutterPreview />` component in Config Studio

Done. No more over-engineering.
