"use client"

import { useState, useEffect, useCallback, useId } from "react"
import { Search, Building2, X, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const INTRO_DISMISSED_KEY = "cu_intro_dismissed"

interface CreditUnion {
  id: string
  charter: string
  displayName: string
  name: string
  city?: string
  state?: string
  assetsFormatted?: string
  membersFormatted?: string
}

export function LandingGate() {
  const searchInputId = useId()
  const emailInputId = useId()
  const passwordInputId = useId()
  const [introVisible, setIntroVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<CreditUnion[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInSent, setSignInSent] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && localStorage.getItem(INTRO_DISMISSED_KEY)
    setIntroVisible(!dismissed)
  }, [])

  const dismissIntro = useCallback(() => {
    setIntroVisible(false)
    if (typeof window !== "undefined") {
      localStorage.setItem(INTRO_DISMISSED_KEY, "1")
    }
  }, [])

  const searchCUs = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearchLoading(true)
    try {
      const res = await fetch(
        `/api/credit-unions/search?q=${encodeURIComponent(q)}&limit=15`
      )
      const data = await res.json()
      type ApiCu = {
        id?: string
        charter?: string
        charter_number?: string
        name?: string
        cu_name?: string
        displayName?: string
        city?: string
        state?: string
        state_id?: string | number
        assetsFormatted?: string
        assets_formatted?: string
        membersFormatted?: string
        members_formatted?: string
      }
      const list = Array.isArray(data) ? data : data?.creditUnions ?? []
      setResults(
        list.map((c: ApiCu) => ({
          id: c.id ?? c.charter ?? "",
          charter: String(c.charter ?? c.charter_number ?? ""),
          displayName: c.displayName ?? c.name ?? c.cu_name ?? "",
          name: c.name ?? c.cu_name ?? "",
          city: c.city,
          state: c.state ?? c.state_id,
          assetsFormatted: c.assetsFormatted ?? c.assets_formatted,
          membersFormatted: c.membersFormatted ?? c.members_formatted,
        }))
      )
    } catch {
      setResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      searchCUs(searchQuery)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, searchCUs])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError(null)
    if (!email.trim()) return
    setSignInLoading(true)
    try {
      const supabase = createClient()
      const emailTrim = email.trim()
      const passwordTrim = password.trim()

      if (passwordTrim) {
        // Email + password sign-in
        if (!supabase.auth?.signInWithPassword) {
          setSignInError("Password sign-in is not configured.")
          return
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrim,
          password: passwordTrim,
        })
        if (error) {
          setSignInError(error.message)
          return
        }
        setSignInSent(true)
      } else {
        // Magic link
        if (!supabase.auth?.signInWithOtp) {
          setSignInError("Sign-in is not configured. Contact your administrator.")
          return
        }
        const { error } = await supabase.auth.signInWithOtp({
          email: emailTrim,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
          },
        })
        if (error) {
          setSignInError(error.message)
          return
        }
        setSignInSent(true)
      }
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSignInLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Intro modal overlay */}
      {introVisible && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-default"
          onClick={(e) => e.target === e.currentTarget && dismissIntro()}
          aria-label="Close intro"
        >
          <div
            className="bg-card border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col cursor-default"
          >
            <div className="p-6 pb-4 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Search for your credit union
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Find your credit union below, then sign in to access your configuration platform.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={dismissIntro} className="shrink-0">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, state, or charter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto border-t px-6 py-4 min-h-[200px] max-h-[280px]">
              {searchLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!searchLoading && results.length === 0 && searchQuery.trim() && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No credit unions found. Try a different search.
                </p>
              )}
              {!searchLoading && results.length > 0 && (
                <ul className="space-y-2">
                  {results.map((cu) => (
                    <li
                      key={cu.id || cu.charter}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-transparent hover:border-muted-foreground/20"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{cu.displayName || cu.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[cu.charter, cu.city, cu.state].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-6 pt-4 border-t bg-muted/30">
              <p className="text-sm text-muted-foreground mb-3">
                Sign in to access configuration and branding for your credit union.
              </p>
              <Button onClick={dismissIntro} className="w-full">
                Continue to sign in
              </Button>
            </div>
          </div>
        </button>
      )}

      {/* Main landing: search + sign-in */}
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {introVisible ? "Sign in" : "Search for your credit union"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to access your tenant configuration platform.
          </p>
        </div>

        {!introVisible && (
          <div className="space-y-2">
            <label htmlFor={searchInputId} className="text-sm font-medium text-foreground">Search credit unions</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={searchInputId}
                placeholder="Name, city, state, or charter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {results.length > 0 && (
              <ul className="border rounded-lg divide-y max-h-48 overflow-auto">
                {results.map((cu) => (
                  <li
                    key={cu.id || cu.charter}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{cu.displayName || cu.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[cu.charter, cu.city, cu.state].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="border rounded-xl p-6 bg-card space-y-4">
          <h3 className="font-medium text-foreground">Sign in to continue</h3>
          {signInSent ? (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Check your email for the sign-in link. You can close this tab after signing in there.</p>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label htmlFor={emailInputId} className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={emailInputId}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={signInLoading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor={passwordInputId} className="sr-only">
                  Password (optional — leave blank for magic link)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={passwordInputId}
                    type="password"
                    placeholder="Password (optional)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    disabled={signInLoading}
                    autoComplete="current-password"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Leave blank to receive a magic link by email.</p>
              </div>
              {signInError && (
                <p className="text-sm text-destructive">{signInError}</p>
              )}
              <Button type="submit" className="w-full" disabled={signInLoading}>
                {signInLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : password.trim() ? (
                  "Sign in"
                ) : (
                  "Send magic link"
                )}
              </Button>
            </form>
          )}
          <p className="text-xs text-muted-foreground">
            After sign-in you’ll enroll in the pilot; then you can access the configuration platform and app download options.
          </p>
        </div>
      </div>
    </div>
  )
}
