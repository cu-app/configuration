"use client"

import { cn } from "@/lib/utils"

/**
 * Small Cyrovoid "cu" wordmark badge for use as an avatar overlay.
 * Uses design tokens only (e.g. text-xs ≈ 12px, theme colors).
 */
export function CuWordmarkBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("text-xs font-normal text-primary-foreground", className)}
      style={{ fontFamily: "var(--font-cu-wordmark)" }}
    >
      cu
    </span>
  )
}
