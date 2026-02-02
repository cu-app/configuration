"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Mail, CheckCircle2, AlertCircle, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreditUnionSearchResult {
  cu_number: string
  cu_name: string
  city: string
  state: string
  website: string
  total_assets: number
}

interface TenantClaimDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClaimSuccess?: (creditUnionId: string) => void
}

export function TenantClaimDialog({ open, onOpenChange, onClaimSuccess }: TenantClaimDialogProps) {
  const [step, setStep] = useState<"search" | "claim" | "verify" | "success">("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CreditUnionSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedCU, setSelectedCU] = useState<CreditUnionSearchResult | null>(null)
  const [email, setEmail] = useState("")
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState("")
  const [verificationToken, setVerificationToken] = useState("")
  const [domainMatches, setDomainMatches] = useState(false)

  // Search for credit unions as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/ncua/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.results || [])
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  async function handleClaim() {
    if (!selectedCU || !email) return

    setClaiming(true)
    setError("")

    try {
      const res = await fetch("/api/tenant/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          charterNumber: selectedCU.cu_number,
          creditUnionId: `cu_${selectedCU.cu_number}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Claim failed")
        return
      }

      setVerificationToken(data.verificationToken)
      setDomainMatches(data.domainMatches)
      setStep("verify")
    } catch (err) {
      setError("Failed to submit claim")
    } finally {
      setClaiming(false)
    }
  }

  async function handleVerify() {
    try {
      const res = await fetch("/api/tenant/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Verification failed")
        return
      }

      setStep("success")
      onClaimSuccess?.(data.creditUnionId)
    } catch (err) {
      setError("Verification failed")
    }
  }

  function formatAssets(assets: number): string {
    if (assets >= 1e9) return `$${(assets / 1e9).toFixed(1)}B`
    if (assets >= 1e6) return `$${(assets / 1e6).toFixed(0)}M`
    return `$${assets.toLocaleString()}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {step === "search" && "Claim Your Credit Union"}
            {step === "claim" && "Verify Your Identity"}
            {step === "verify" && "Check Your Email"}
            {step === "success" && "Claim Successful"}
          </DialogTitle>
          <DialogDescription>
            {step === "search" && "Search for your credit union to begin the claim process"}
            {step === "claim" && "Enter your work email to verify ownership"}
            {step === "verify" && "We sent a verification link to your email"}
            {step === "success" && "You now have access to your credit union's configuration"}
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Start typing your credit union name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-64 overflow-auto">
                {searchResults.map((cu) => (
                  <button
                    key={cu.cu_number}
                    className={cn(
                      "w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0",
                      selectedCU?.cu_number === cu.cu_number && "bg-primary/10",
                    )}
                    onClick={() => {
                      setSelectedCU(cu)
                      setStep("claim")
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{cu.cu_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cu.city}, {cu.state} • Charter #{cu.cu_number}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatAssets(cu.total_assets)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No credit unions found matching "{searchQuery}"
              </p>
            )}
          </div>
        )}

        {step === "claim" && selectedCU && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedCU.cu_name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedCU.city}, {selectedCU.state} • {formatAssets(selectedCU.total_assets)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@yourcreditunion.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your email domain must match the credit union's official domain for verification
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("search")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleClaim} disabled={!email || claiming} className="flex-1">
                {claiming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Verification
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            {domainMatches ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  Email domain matches NCUA records. Check your inbox for the verification link.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Email domain does not match NCUA records. Manual verification may be required.
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground">
              Click the link in your email to complete verification, or enter the code below:
            </p>

            <Input
              placeholder="Verification code"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleVerify} className="w-full">
              Verify & Claim
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              You can now configure your credit union's mobile app and website.
            </p>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Get Started
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
