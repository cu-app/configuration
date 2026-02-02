"use client"

export interface CallerConfidenceState {
  verificationIcon: string
  verificationStatusMessage: string
  verificationStatusIcon: string
  verificationStatusIconClass: string
  confidenceTitle: string
  confidenceMessage: string
  confidenceIcon: string
  confidenceIconClass: string
}

export function getCallerConfidence(phoneCallData: {
  isAuthorized?: boolean
  isIdentified?: boolean
  seekingServiceOnMembership?: string
} | null): CallerConfidenceState {
  if (!phoneCallData) {
    return {
      verificationIcon: "",
      verificationStatusMessage: "",
      verificationStatusIcon: "",
      verificationStatusIconClass: "",
      confidenceTitle: "",
      confidenceMessage: "",
      confidenceIcon: "",
      confidenceIconClass: "",
    }
  }
  const { isAuthorized, isIdentified, seekingServiceOnMembership } = phoneCallData

  if (isAuthorized && isIdentified) {
    return {
      verificationIcon: "verified_user",
      verificationStatusMessage: "Member Has Been Verified",
      verificationStatusIcon: "check_circle",
      verificationStatusIconClass: "verification-good",
      confidenceTitle: "Good to go!",
      confidenceMessage: "Caller identified with phone number",
      confidenceIcon: "check_circle",
      confidenceIconClass: "confidence-good-big",
    }
  }
  if (isAuthorized && !isIdentified && seekingServiceOnMembership) {
    return {
      verificationIcon: "verified_user",
      verificationStatusMessage: "Member Has Been Verified",
      verificationStatusIcon: "check_circle",
      verificationStatusIconClass: "verification-good",
      confidenceTitle: "Good to go!",
      confidenceMessage: "Caller identified with Member number.",
      confidenceIcon: "flaky",
      confidenceIconClass: "green-good-big",
    }
  }
  if (!isAuthorized && isIdentified) {
    return {
      verificationIcon: "mobile_off",
      verificationStatusMessage: "Verification Is Required",
      verificationStatusIcon: "warning",
      verificationStatusIconClass: "verification-caution",
      confidenceTitle: "Member Identified",
      confidenceMessage: "Please proceed with verification.",
      confidenceIcon: "warning",
      confidenceIconClass: "confidence-caution",
    }
  }
  if (!isAuthorized && !isIdentified) {
    return {
      verificationIcon: "mobile_off",
      verificationStatusMessage: "Caller Not Identified",
      verificationStatusIcon: "cancel",
      verificationStatusIconClass: "verification-danger",
      confidenceTitle: "Unknown Caller",
      confidenceMessage: "Please proceed with verification.",
      confidenceIcon: "cancel",
      confidenceIconClass: "confidence-danger",
    }
  }
  return {
    verificationIcon: "",
    verificationStatusMessage: "",
    verificationStatusIcon: "",
    verificationStatusIconClass: "",
    confidenceTitle: "",
    confidenceMessage: "",
    confidenceIcon: "",
    confidenceIconClass: "",
  }
}

export interface CallerConfidenceProps {
  state: CallerConfidenceState
}

export function CallerConfidence({ state }: CallerConfidenceProps) {
  if (!state.verificationStatusMessage) return null
  return (
    <div className="rounded-lg border bg-card p-3 space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{state.verificationStatusMessage}</span>
      </div>
      <p className="text-xs text-muted-foreground">{state.confidenceMessage}</p>
      {state.confidenceTitle && (
        <p className="text-xs font-medium mt-1">{state.confidenceTitle}</p>
      )}
    </div>
  )
}
