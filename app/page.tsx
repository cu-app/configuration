"use client"

import { Toaster } from "sonner"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { UnifiedPlatform } from "@/components/unified-platform"
import { ErrorBoundary } from "@/components/error-boundary"

export default function Home() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <main className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  // Always show full platform shell: left sidebar (all menu options + CU dropdown) + main area.
  // When not signed in, main area shows sign-in/landing; when signed in, main area shows selected view.
  return (
    <main className="h-screen bg-background">
      <ErrorBoundary>
        <UnifiedPlatform />
      </ErrorBoundary>
      <Toaster position="bottom-right" />
    </main>
  )
}
