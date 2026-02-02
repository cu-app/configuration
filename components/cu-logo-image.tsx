"use client"

import { useState, useEffect } from "react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface CULogoImageProps {
  cu: CreditUnionData
  size?: number
  className?: string
  variant?: "color" | "white" | "monochrome"
  fallbackToInitials?: boolean
}

/**
 * Credit Union Logo Image with multi-source fallback chain
 *
 * Tries logos in order of quality:
 * 1. Direct/Primary (from Supabase or manual)
 * 2. Brandfetch CDN (highest quality)
 * 3. Clearbit API (high quality)
 * 4. Google Favicon (reliable)
 * 5. DuckDuckGo (fallback)
 * 6. Initials with brand color (last resort)
 */
export function CULogoImage({
  cu,
  size = 48,
  className = "",
  variant = "color",
  fallbackToInitials = true,
}: CULogoImageProps) {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [allFailed, setAllFailed] = useState(false)

  // Build logo fallback chain (quality-ordered)
  const logoChain = buildLogoChain(cu)

  // Reset state when CU changes
  useEffect(() => {
    setCurrentLogoIndex(0)
    setImageLoaded(false)
    setAllFailed(false)
  }, [cu.id, cu.charter])

  const handleImageError = () => {
    if (currentLogoIndex < logoChain.length - 1) {
      setCurrentLogoIndex((prev) => prev + 1)
      setImageLoaded(false)
    } else {
      setAllFailed(true)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const primaryColor = cu.primaryColor || cu.logoFallbackColor || "#1e3a5f"
  const displayName = cu.displayName || cu.name

  // Show initials if all logos failed
  if (allFailed && fallbackToInitials) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: primaryColor,
        }}
        title={displayName}
      >
        <span
          className="font-bold text-white"
          style={{ fontSize: size * 0.4 }}
        >
          {getInitials(displayName)}
        </span>
      </div>
    )
  }

  const currentLogoUrl = logoChain[currentLogoIndex]

  // Apply variant filters
  const filterStyle = variant === "white"
    ? { filter: "brightness(0) invert(1)" }
    : variant === "monochrome"
    ? { filter: "grayscale(100%) contrast(1.2)" }
    : {}

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Loading placeholder */}
      {!imageLoaded && !allFailed && (
        <div
          className="absolute inset-0 animate-pulse rounded-lg"
          style={{ backgroundColor: `${primaryColor}20` }}
        />
      )}

      {/* Logo image */}
      <img
        src={currentLogoUrl}
        alt={`${displayName} logo`}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={filterStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  )
}

/**
 * Build the logo fallback chain in quality order
 */
function buildLogoChain(cu: CreditUnionData): string[] {
  const chain: string[] = []
  const domain = cu.logoDomain || extractDomain(cu.website)

  // 1. Direct/Primary (highest quality if available)
  if (cu.logoUrls?.direct) {
    chain.push(cu.logoUrls.direct)
  }

  // 2. Main logoUrl (if different from direct)
  if (cu.logoUrl && !chain.includes(cu.logoUrl)) {
    chain.push(cu.logoUrl)
  }

  // 3. Brandfetch (very high quality)
  if (cu.logoUrls?.brandfetch) {
    chain.push(cu.logoUrls.brandfetch)
  } else if (domain) {
    chain.push(`https://cdn.brandfetch.io/${domain}/w/400/h/400`)
  }

  // 4. Clearbit (high quality)
  if (cu.logoUrls?.clearbit) {
    chain.push(cu.logoUrls.clearbit)
  } else if (domain) {
    chain.push(`https://logo.clearbit.com/${domain}?size=256`)
  }

  // 5. Google Favicon (reliable)
  if (cu.logoUrls?.google) {
    chain.push(cu.logoUrls.google)
  } else if (domain) {
    chain.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)
  }

  // 6. DuckDuckGo (last fallback)
  if (cu.logoUrls?.duckduckgo) {
    chain.push(cu.logoUrls.duckduckgo)
  } else if (domain) {
    chain.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`)
  }

  // Remove duplicates while preserving order
  return [...new Set(chain)]
}

function extractDomain(website: string | undefined): string | null {
  if (!website) return null
  try {
    const url = website.startsWith("http") ? website : `https://${website}`
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return website
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

/**
 * Logo with colored background container
 */
export function CULogoWithBackground({
  cu,
  size = 64,
  logoSize,
  className = "",
  rounded = "xl",
}: CULogoImageProps & {
  logoSize?: number
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full"
}) {
  const primaryColor = cu.primaryColor || cu.logoFallbackColor || "#1e3a5f"
  const actualLogoSize = logoSize || size * 0.6

  const roundedClass = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  }[rounded]

  return (
    <div
      className={`flex items-center justify-center ${roundedClass} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: primaryColor,
      }}
    >
      <CULogoImage
        cu={cu}
        size={actualLogoSize}
        variant="white"
        fallbackToInitials={true}
      />
    </div>
  )
}
