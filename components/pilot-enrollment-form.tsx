"use client"

import { useState, useEffect, useId } from "react"
import { Building2, Mail, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { User as AuthUser } from "@supabase/supabase-js"

interface PilotEnrollmentFormProps {
  user: AuthUser | null
  onSuccess?: () => void
  /** If true, show compact layout for use inside Sheet/Dialog */
  embedded?: boolean
}

export function PilotEnrollmentForm({ user, onSuccess, embedded }: PilotEnrollmentFormProps) {
  const [formData, setFormData] = useState({
    cuName: "",
    charterNumber: "",
    contactName: "",
    contactEmail: "",
    contactTitle: "",
    developerCount: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cuNameId = useId()
  const charterId = useId()
  const contactNameId = useId()
  const contactEmailId = useId()
  const contactTitleId = useId()
  const developerCountId = useId()

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, contactEmail: user.email ?? prev.contactEmail }))
    }
  }, [user?.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/culauncher/pilot-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cuName: formData.cuName.trim(),
          charterNumber: formData.charterNumber.trim(),
          contactName: formData.contactName.trim(),
          contactEmail: formData.contactEmail.trim() || user?.email,
          contactTitle: formData.contactTitle.trim() || null,
          developerCount: formData.developerCount.trim() ? parseInt(formData.developerCount, 10) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to submit")
        return
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={embedded ? "space-y-4" : "space-y-4"}>
      {!embedded && (
        <p className="text-sm text-muted-foreground">
          Enroll to unlock app download links (App Store / Google Play).
        </p>
      )}
      <div>
        <label htmlFor={cuNameId} className="block text-sm font-medium text-foreground mb-1">
          Credit union name *
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={cuNameId}
            required
            placeholder="e.g. Navy Federal Credit Union"
            value={formData.cuName}
            onChange={(e) => setFormData({ ...formData, cuName: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <label htmlFor={charterId} className="block text-sm font-medium text-foreground mb-1">
          Charter number *
        </label>
        <Input
          id={charterId}
          required
          placeholder="e.g. 5536"
          value={formData.charterNumber}
          onChange={(e) => setFormData({ ...formData, charterNumber: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor={contactNameId} className="block text-sm font-medium text-foreground mb-1">
          Your name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={contactNameId}
            required
            placeholder="Full name"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <label htmlFor={contactEmailId} className="block text-sm font-medium text-foreground mb-1">
          Contact email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id={contactEmailId}
            required
            type="email"
            placeholder="you@creditunion.org"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <label htmlFor={contactTitleId} className="block text-sm font-medium text-foreground mb-1">
          Title (optional)
        </label>
        <Input
          id={contactTitleId}
          placeholder="e.g. Digital Director"
          value={formData.contactTitle}
          onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor={developerCountId} className="block text-sm font-medium text-foreground mb-1">
          Developer count (optional)
        </label>
        <Input
          id={developerCountId}
          type="number"
          min={0}
          placeholder="How many developers will work on this?"
          value={formData.developerCount}
          onChange={(e) => setFormData({ ...formData, developerCount: e.target.value })}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit enrollment"}
      </Button>
    </form>
  )
}
