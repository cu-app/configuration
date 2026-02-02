"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Check, RefreshCw, Building2 } from "lucide-react"

interface Branch {
  placeId: string
  name: string
  address: string
  location: { lat: number; lng: number }
  rating?: number
  userRatingsTotal?: number
  businessStatus?: string
  photos?: { reference: string; width: number; height: number }[]
  verified: boolean
}

interface BranchVerificationPanelProps {
  creditUnionName: string
  city: string
  state: string
  onBranchesVerified?: (branches: Branch[]) => void
}

export function BranchVerificationPanel({
  creditUnionName,
  city,
  state,
  onBranchesVerified,
}: BranchVerificationPanelProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [discovered, setDiscovered] = useState(false)
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set())

  async function discoverBranches() {
    setLoading(true)
    try {
      const response = await fetch("/api/branches/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditUnionName, city, state }),
      })
      const data = await response.json()
      setBranches(data.branches || [])
      setDiscovered(true)
      // Auto-select all branches initially
      setSelectedBranches(new Set(data.branches?.map((b: Branch) => b.placeId) || []))
    } catch (error) {
      console.error("Failed to discover branches:", error)
    } finally {
      setLoading(false)
    }
  }

  function toggleBranch(placeId: string) {
    setSelectedBranches((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) {
        next.delete(placeId)
      } else {
        next.add(placeId)
      }
      return next
    })
  }

  function handleVerify() {
    const verifiedBranches = branches
      .filter((b) => selectedBranches.has(b.placeId))
      .map((b) => ({ ...b, verified: true }))
    onBranchesVerified?.(verifiedBranches)
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Branch Location Discovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!discovered ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Discover all {creditUnionName} branches via Google Places
            </p>
            <Button onClick={discoverBranches} disabled={loading} size="sm">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Discover Branches
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{branches.length} locations found</Badge>
              <Button variant="ghost" size="sm" onClick={discoverBranches} disabled={loading}>
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.placeId}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedBranches.has(branch.placeId) ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedBranches.has(branch.placeId)}
                      onCheckedChange={() => toggleBranch(branch.placeId)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{branch.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{branch.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {branch.rating && (
                          <Badge variant="secondary" className="text-xs">
                            ★ {branch.rating}
                          </Badge>
                        )}
                        {branch.businessStatus === "OPERATIONAL" && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Open
                          </Badge>
                        )}
                      </div>
                    </div>
                    {branch.photos?.[0] && (
                      <div className="w-16 h-12 rounded overflow-hidden bg-muted">
                        <img
                          src={`/api/branches/photo?ref=${branch.photos[0].reference}&maxwidth=100`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedBranches.size} of {branches.length} selected
              </span>
              <Button size="sm" onClick={handleVerify} disabled={selectedBranches.size === 0}>
                <Check className="h-4 w-4 mr-2" />
                Verify & Add to App
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
