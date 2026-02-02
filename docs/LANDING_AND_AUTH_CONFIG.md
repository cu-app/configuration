# Full config: landing, auth, and tenant flow

This doc reflects the **reverted** state: tenants are shown via search only, **no app preview before login**. Sign-in is required to access the platform and app preview.

---

## 1. Home page (`app/page.tsx`)

- **Loading:** spinner while auth is resolving.
- **Not signed in:** render `LandingGate` (search + sign-in only).
- **Signed in:** render `UnifiedPlatform` (full config + app preview, pilot enrollment, etc.).

```tsx
// app/page.tsx (full)
"use client"

import { Toaster } from "sonner"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LandingGate } from "@/components/landing-gate"
import { UnifiedPlatform } from "@/components/unified-platform"
import { ErrorBoundary } from "@/components/error-boundary"

export default function Home() {
  const { user, loading, isPilotEnrolled } = useAuth()

  if (loading) {
    return (
      <main className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="h-screen bg-background">
        <LandingGate />
        <Toaster position="bottom-right" />
      </main>
    )
  }

  return (
    <main className="h-screen bg-background">
      <ErrorBoundary>
        <UnifiedPlatform />
      </ErrorBoundary>
      <Toaster position="bottom-right" />
    </main>
  )
}
```

---

## 2. Landing gate (`components/landing-gate.tsx`)

- **Intro modal (first visit):** “Search for your credit union” + search input + list of results (display only, no preview). “Continue to sign in” dismisses modal.
- **Main view:** “Search for your credit union” / “Sign in to continue” + CU search list (display only) + sign-in form (magic link).
- **No app preview:** No default Navy Federal preview, no click-to-preview. Tenants are shown in lists only; preview is only after sign-in inside `UnifiedPlatform`.

Key state:

- `introVisible` – show intro modal until user dismisses (stored in `localStorage` key `cu_intro_dismissed`).
- `searchQuery` / `results` – search CUs via `/api/credit-unions/search?q=...&limit=15`; results are **list only** (no `previewCu`, no `AppBuilderStudio`).
- `email` / `signInLoading` / `signInSent` / `signInError` – magic link sign-in via Supabase `signInWithOtp`.

No imports of `AppBuilderStudio` or `toMinimalCreditUnionData`. No `DEFAULT_PREVIEW_CU` or `previewCu` state.

---

## 3. Credit union data (`lib/credit-union-data.ts`)

- **No `toMinimalCreditUnionData`:** That helper was removed when reverting the public preview.
- **Exports:** `CreditUnionData`, `TOP_20_CREDIT_UNIONS`, `getClearbitLogoUrl`, `getBrandfetchLogoUrl`, `CoreBankingInfo`, etc. Used by the rest of the app (e.g. `UnifiedPlatform`, config, MX app).

---

## 4. Auth and post–sign-in flow

- **Auth:** `lib/auth-context.tsx` – `AuthProvider`, `useAuth()` (user, loading, isPilotEnrolled, refreshPilotStatus, etc.). Supabase session + optional pilot enrollment via `/api/pilot/me` and pilot-apply.
- **After sign-in:** User sees `UnifiedPlatform`: CU picker, Configuration, App Preview, Marketing Site, pilot enrollment (e.g. “Enroll in pilot” in sidebar), etc. App preview and download options live here, **not** on the landing page.

---

## 5. Summary

| Concern              | Config / behavior |
|----------------------|-------------------|
| Landing (not signed in) | Search for credit union + sign in to continue. Tenants shown in lists only. |
| App preview          | Only after sign-in, inside UnifiedPlatform (App Preview view). |
| Default CU / Navy Fed | No default preview on landing. |
| Public preview       | Removed; no click-to-preview before login. |
| Sign-in              | Magic link (Supabase `signInWithOtp`), redirect to `/` after sign-in. |
| Pilot / downloads    | Gated after sign-in (pilot enrollment in UnifiedPlatform). |

Files that define this flow:

- `app/page.tsx` – home, auth gate, LandingGate vs UnifiedPlatform.
- `components/landing-gate.tsx` – search + sign-in only, no preview.
- `lib/auth-context.tsx` – auth state and pilot status.
- `lib/credit-union-data.ts` – CU types and data (no `toMinimalCreditUnionData`).
