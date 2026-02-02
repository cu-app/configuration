// SHARED CU LOGO COMPONENT
// Reusable across admin, marketing, and preview views
// Handles logo fallback chain consistently

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface CULogoProps {
  cu: CreditUnionData
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  variant?: "color" | "white" | "mono"
  className?: string
  showBorder?: boolean
}

const SIZES = {
  xs: { container: "h-5 w-5", text: "text-[8px]", img: "w-3 h-3" },
  sm: { container: "h-6 w-6", text: "text-[10px]", img: "w-4 h-4" },
  md: { container: "h-8 w-8", text: "text-xs", img: "w-5 h-5" },
  lg: { container: "h-12 w-12", text: "text-base", img: "w-8 h-8" },
  xl: { container: "h-16 w-16", text: "text-xl", img: "w-10 h-10" },
}

export function CULogo({ cu, size = "md", variant = "color", className, showBorder = false }: CULogoProps) {
  const [logoSrc, setLogoSrc] = useState<string>("")
  const [fallbackIndex, setFallbackIndex] = useState(0)
  const [hasError, setHasError] = useState(false)

  const fallbackChain = [
    cu.logoUrls?.direct,
    cu.logoUrls?.brandfetch,
    cu.logoUrls?.clearbit,
    cu.logoUrls?.google,
  ].filter(Boolean) as string[]

  useEffect(() => {
    setFallbackIndex(0)
    setHasError(false)
    setLogoSrc(fallbackChain[0] || "")
  }, [cu.id])

  function handleError() {
    if (fallbackIndex < fallbackChain.length - 1) {
      setFallbackIndex(fallbackIndex + 1)
      setLogoSrc(fallbackChain[fallbackIndex + 1])
    } else {
      setHasError(true)
      setLogoSrc("")
    }
  }

  const sizeConfig = SIZES[size]

  const filterStyle =
    variant === "mono"
      ? { filter: "grayscale(100%) contrast(1.2) brightness(0)" }
      : variant === "white"
        ? { filter: "grayscale(100%) contrast(1.2) brightness(100)" }
        : {}

  // Text fallback
  if (!logoSrc || hasError) {
    return (
      <div
        className={cn(
          "rounded-lg flex items-center justify-center font-bold text-white shrink-0",
          sizeConfig.container,
          showBorder && "border",
          className,
        )}
        style={{ backgroundColor: variant === "white" ? "transparent" : cu.primaryColor }}
      >
        <span className={cn(sizeConfig.text, variant === "white" && "text-white")}>
          {cu.displayName.substring(0, 2).toUpperCase()}
        </span>
      </div>
    )
  }

  // Image logo
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-lg overflow-hidden flex items-center justify-center",
        sizeConfig.container,
        showBorder && "border",
        variant === "color" ? "bg-white" : "",
        className,
      )}
      style={{
        backgroundColor: variant !== "color" ? cu.primaryColor : undefined,
      }}
    >
      <img
        src={logoSrc || "/placeholder.svg"}
        alt={cu.displayName}
        className={cn("object-contain p-0.5", sizeConfig.img)}
        style={filterStyle}
        onError={handleError}
      />
    </div>
  )
}
