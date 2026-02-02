"use client"

export interface CallBannerProps {
  ani?: string
  start?: string
  end?: string
  isVerified?: boolean
  isIdentified?: boolean
}

export function CallBanner({ ani, start, end, isVerified, isIdentified }: CallBannerProps) {
  const status =
    isVerified && isIdentified
      ? "Member verified"
      : isIdentified
        ? "Verification required"
        : "Caller not identified"

  return (
    <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">{status}</span>
        {ani && (
          <span className="text-sm text-muted-foreground">ANI: {ani}</span>
        )}
      </div>
      {(start || end) && (
        <span className="text-sm text-muted-foreground">
          {start && `Start: ${start}`}
          {end && ` End: ${end}`}
        </span>
      )}
    </div>
  )
}
