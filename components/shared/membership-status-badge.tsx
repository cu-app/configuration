"use client"

export type MembershipStatusType = "open" | "closed" | "unknown"

const CONFIGS: Record<MembershipStatusType, { display: boolean; text: string; className: string }> = {
  open: { display: false, text: "OPEN", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  closed: { display: true, text: "CLOSED", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  unknown: { display: false, text: "UNKNOWN", className: "bg-muted text-muted-foreground" },
}

export interface MembershipStatusBadgeProps {
  type: MembershipStatusType
  className?: string
}

export function MembershipStatusBadge({ type, className }: MembershipStatusBadgeProps) {
  const config = CONFIGS[type] ?? CONFIGS.unknown
  if (!config.display && type !== "closed") return null
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${config.className} ${className ?? ""}`}
    >
      {config.text}
    </span>
  )
}
