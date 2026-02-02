"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Building2, MapPin, Users, DollarSign, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CreditUnion {
  cu_number?: string
  charter_number: string
  cu_name: string
  city?: string
  state?: string
  total_assets?: number
  total_members?: number
  logo_url?: string
  primary_color?: string
}

export function CUSearchSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<CreditUnion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCU, setSelectedCU] = useState<CreditUnion | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(
        `/api/culauncher/cu-search?q=${encodeURIComponent(query)}&limit=20`
      )
      const data = await response.json()
      setResults(data.creditUnions || [])
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (cu: CreditUnion) => {
    try {
      const response = await fetch("/api/culauncher/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charterNumber: cu.charter_number,
          cuName: cu.cu_name,
        }),
      })

      if (response.ok) {
        setSelectedCU(cu)
        alert(`Claim request submitted for ${cu.cu_name}`)
      }
    } catch (error) {
      console.error("Claim error:", error)
    }
  }

  return (
    <section className="py-24 bg-white border-t-2 border-black">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Credit Union
          </h2>
          <p className="text-xl text-gray-600">
            Search all 4,822 NCUA credit unions. Claim yours and see your pre-configured setup.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, city, state, or charter number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg border-2 border-black rounded-none bg-white"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No credit unions found. Try a different search term.
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((cu) => (
              <Card
                key={cu.charter_number}
                className="border-2 border-black rounded-none hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCU(cu)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {cu.logo_url ? (
                      <img
                        src={cu.logo_url}
                        alt={cu.cu_name}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-black flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1 truncate">
                        {cu.cu_name}
                      </h3>
                      {cu.city && cu.state && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {cu.city}, {cu.state}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {cu.charter_number && (
                      <div className="text-sm">
                        <span className="font-semibold">Charter:</span> {cu.charter_number}
                      </div>
                    )}
                    {cu.total_members && (
                      <div className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        {cu.total_members.toLocaleString()} members
                      </div>
                    )}
                    {cu.total_assets && (
                      <div className="text-sm flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        ${(cu.total_assets / 1_000_000).toFixed(1)}M assets
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClaim(cu)
                    }}
                    className="w-full bg-black text-white hover:bg-gray-800 rounded-none border-2 border-black"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Claim This CU
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedCU && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full border-2 border-black rounded-none bg-white">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold">{selectedCU.cu_name}</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCU(null)}
                    className="text-black"
                  >
                    ×
                  </Button>
                </div>
                <div className="space-y-4">
                  <p>
                    <strong>Charter Number:</strong> {selectedCU.charter_number}
                  </p>
                  {selectedCU.city && selectedCU.state && (
                    <p>
                      <strong>Location:</strong> {selectedCU.city}, {selectedCU.state}
                    </p>
                  )}
                  {selectedCU.total_members && (
                    <p>
                      <strong>Members:</strong> {selectedCU.total_members.toLocaleString()}
                    </p>
                  )}
                  {selectedCU.total_assets && (
                    <p>
                      <strong>Assets:</strong> ${(selectedCU.total_assets / 1_000_000).toFixed(1)}M
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleClaim(selectedCU)}
                  className="mt-6 w-full bg-black text-white hover:bg-gray-800 rounded-none"
                >
                  Claim This Credit Union
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
