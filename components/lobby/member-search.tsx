"use client"

import { useState } from "react"
import type { MemberLookupResult } from "@/types/member"

export interface MemberSearchProps {
  tenantId?: string
  onSelectMember?: (memberNumber: string) => void
}

export function MemberSearch({ tenantId, onSelectMember }: MemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MemberLookupResult | null>(null)

  const search = async () => {
    const term = searchTerm.trim()
    if (!term) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/members/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          /^\d+$/.test(term) && term.length <= 10
            ? { memberNumber: term, tenantId }
            : term.includes("-") || term.length > 10
              ? { accountNumber: term, tenantId }
              : { phoneNumber: term, tenantId }
        ),
      })
      const data = await res.json()
      setResult(data)
      if (data.member_numbers?.length === 1 && onSelectMember) {
        onSelectMember(data.member_numbers[0])
      }
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Member number, account number, or phone"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !searchTerm.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {result && !loading && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          {result.success ? (
            <>
              {result.member_numbers && result.member_numbers.length > 0 ? (
                <ul className="space-y-2">
                  {result.member_numbers.map((num) => (
                    <li key={num}>
                      <button
                        type="button"
                        onClick={() => onSelectMember?.(num)}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Member {num}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No results.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-destructive">{result.error ?? "Search failed."}</p>
          )}
        </div>
      )}
    </div>
  )
}
