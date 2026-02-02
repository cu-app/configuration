"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { PilotEnrollmentForm } from "./pilot-enrollment-form"

/** Full-page pilot enrollment (e.g. for culauncher or redirect). */
export function PilotEnrollmentGate() {
  const { user, refreshPilotStatus } = useAuth()
  const [submitted, setSubmitted] = useState(false)

  const handleSuccess = () => {
    setSubmitted(true)
    refreshPilotStatus()
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md border rounded-xl p-8 bg-card text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Application received</h2>
          <p className="text-sm text-muted-foreground">
            You’re enrolled in the pilot. We’ll contact you soon. You now have access to app download options.
          </p>
          <Button onClick={() => { setSubmitted(false); refreshPilotStatus() }} variant="outline" className="w-full">
            Refresh to continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Rocket className="h-7 w-7" />
            Enroll in the pilot
          </h1>
          <p className="text-sm text-muted-foreground">
            Enroll in the pilot program to unlock app download links (App Store / Google Play).
          </p>
        </div>
        <div className="border rounded-xl p-6 bg-card">
          <PilotEnrollmentForm user={user} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}
