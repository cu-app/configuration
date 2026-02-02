"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Tablet, RotateCcw, Loader2, Sparkles, ExternalLink } from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface FlutterDevicePreviewProps {
  cu: CreditUnionData
}

type DeviceType = "iphone" | "iphone-mini" | "ipad" | "android" | "android-tablet"

interface DeviceConfig {
  name: string
  width: number
  height: number
  bezelRadius: number
  notchType: "dynamic-island" | "notch" | "none" | "punch-hole"
  icon: React.ReactNode
}

const DEVICES: Record<DeviceType, DeviceConfig> = {
  "iphone": {
    name: "iPhone 15 Pro",
    width: 393,
    height: 852,
    bezelRadius: 55,
    notchType: "dynamic-island",
    icon: <Smartphone className="h-4 w-4" />,
  },
  "iphone-mini": {
    name: "iPhone SE",
    width: 375,
    height: 667,
    bezelRadius: 40,
    notchType: "none",
    icon: <Smartphone className="h-3 w-3" />,
  },
  "android": {
    name: "Pixel 8",
    width: 412,
    height: 915,
    bezelRadius: 45,
    notchType: "punch-hole",
    icon: <Smartphone className="h-4 w-4" />,
  },
  "ipad": {
    name: "iPad Pro 11\"",
    width: 834,
    height: 1194,
    bezelRadius: 30,
    notchType: "none",
    icon: <Tablet className="h-4 w-4" />,
  },
  "android-tablet": {
    name: "Galaxy Tab S9",
    width: 800,
    height: 1280,
    bezelRadius: 25,
    notchType: "none",
    icon: <Tablet className="h-4 w-4" />,
  },
}

/**
 * FlutterDevicePreview - Displays a real Flutter app with tenant branding
 *
 * Uses the cu_ui design system built as Flutter Web and hosted at /flutter-preview/
 * Passes tenant config via URL query parameters
 */
export function FlutterDevicePreview({ cu }: FlutterDevicePreviewProps) {
  const [device, setDevice] = useState<DeviceType>("iphone")
  const [iframeKey, setIframeKey] = useState(0)
  const [loading, setLoading] = useState(true)

  const config = DEVICES[device]
  const scale = device.includes("ipad") || device.includes("tablet") ? 0.5 : 0.65
  const primaryColor = cu.primaryColor || "#1e40af"

  // Get best logo URL
  const domain = cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const logoUrl = cu.logoUrl || cu.logoUrls?.clearbit || cu.logoUrls?.direct || (domain ? `https://logo.clearbit.com/${domain}` : '')

  // Build URL for the hosted Flutter app with tenant config params
  const flutterAppUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('name', cu.displayName || cu.name || 'Credit Union')
    params.set('color', primaryColor.replace('#', ''))
    if (logoUrl) params.set('logo', logoUrl)
    if (cu.charter) params.set('charter', cu.charter.toString())
    if (cu.assetsFormatted) params.set('assets', cu.assetsFormatted)
    if (cu.membersFormatted) params.set('members', cu.membersFormatted)

    return `/flutter-preview/index.html?${params.toString()}`
  }, [cu, primaryColor, logoUrl])

  // Reset loading state when CU changes
  useEffect(() => {
    setLoading(true)
    setIframeKey(prev => prev + 1)
  }, [cu.id])

  const handleRestart = () => {
    setLoading(true)
    setIframeKey(prev => prev + 1)
  }

  const handleOpenFullscreen = () => {
    window.open(flutterAppUrl, '_blank')
  }

  return (
    <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-full">
      {/* Header with cu_ui badge */}
      <div className="flex items-center gap-3 mb-4">
        <Badge variant="outline" className="gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
          <Sparkles className="h-3 w-3" />
          cu_ui Design System
        </Badge>
        <Badge variant="outline" className="text-white/70 border-white/20">
          Real Flutter Web App
        </Badge>
      </div>

      {/* Device Toggles */}
      <div className="flex items-center gap-2 mb-6">
        {(Object.entries(DEVICES) as [DeviceType, DeviceConfig][]).map(([key, dev]) => (
          <Button
            key={key}
            variant={device === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setDevice(key)}
            className={cn(
              "gap-2 text-xs",
              device === key ? "bg-white text-black" : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            {dev.icon}
            <span className="hidden sm:inline">{dev.name}</span>
          </Button>
        ))}
        <div className="w-px h-6 bg-white/20 mx-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Restart</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenFullscreen}
          className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Fullscreen</span>
        </Button>
      </div>

      {/* Device Frame */}
      <div
        className="relative bg-black shadow-2xl"
        style={{
          width: config.width * scale + 24,
          height: config.height * scale + 24,
          borderRadius: config.bezelRadius * scale,
          padding: 12,
          boxShadow: "0 50px 100px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        {/* Side Buttons (iPhone) */}
        {device.startsWith("iphone") && (
          <>
            <div className="absolute -left-[3px] top-[20%] w-[3px] h-[8%] bg-[#2a2a2a] rounded-l-sm" />
            <div className="absolute -left-[3px] top-[32%] w-[3px] h-[12%] bg-[#2a2a2a] rounded-l-sm" />
            <div className="absolute -left-[3px] top-[46%] w-[3px] h-[12%] bg-[#2a2a2a] rounded-l-sm" />
            <div className="absolute -right-[3px] top-[30%] w-[3px] h-[15%] bg-[#2a2a2a] rounded-r-sm" />
          </>
        )}

        {/* Screen */}
        <div
          className="relative w-full h-full overflow-hidden bg-black"
          style={{ borderRadius: (config.bezelRadius - 8) * scale }}
        >
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 text-white/50 animate-spin mb-4" />
              <p className="text-white/50 text-sm">Loading {cu.displayName || cu.name} app...</p>
              <p className="text-white/30 text-xs mt-1">cu_ui Flutter Web</p>
            </div>
          )}

          {/* Dynamic Island / Notch Overlay */}
          {config.notchType === "dynamic-island" && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-full z-50"
              style={{ width: 120 * scale, height: 35 * scale }}
            />
          )}
          {config.notchType === "punch-hole" && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-black rounded-full z-50"
              style={{ width: 12 * scale, height: 12 * scale }}
            />
          )}

          {/* Flutter App Iframe - Hosted cu_ui app */}
          <iframe
            key={iframeKey}
            src={flutterAppUrl}
            className="w-full h-full border-0"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
            }}
            allow="clipboard-write"
            onLoad={() => setLoading(false)}
            title={`${cu.displayName || cu.name} Flutter App Preview`}
          />

          {/* Home Indicator */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/30 rounded-full z-50"
            style={{ width: 120 * scale, height: 5 * scale }}
          />
        </div>
      </div>

      {/* CU Info */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={cu.displayName || cu.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span className="text-white text-sm font-bold">
                {(cu.displayName || cu.name).substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold">{cu.displayName || cu.name}</p>
            <p className="text-white/50 text-xs">Charter #{cu.charter} • {cu.state}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/40">
          <span>{cu.assetsFormatted} assets</span>
          <span>•</span>
          <span>{cu.membersFormatted} members</span>
        </div>
      </div>

      {/* Attribution */}
      <div className="mt-6 flex items-center gap-2 text-white/30 text-xs">
        <Sparkles className="h-3 w-3" />
        <span>Built with cu_ui design system • 50+ components • Real Flutter Web</span>
      </div>
    </div>
  )
}
