"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Smartphone } from "lucide-react"
import { CULogoImage } from "@/components/cu-logo-image"
import { useInspectorConfigBridge } from "@/lib/inspector-config-bridge"
import { getClearbitLogoUrl, type CreditUnionData } from "@/lib/credit-union-data"

/** True if URL is likely SVG (Flutter Image.network doesn't render SVG). */
function isSvgUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase()
    return path.endsWith(".svg")
  } catch {
    return url.toLowerCase().includes(".svg")
  }
}

function domainFromCu(cu: CreditUnionData): string | undefined {
  const raw = cu.logoDomain || cu.website || ""
  if (!raw) return undefined
  const clean = raw.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]
  return clean || undefined
}

/**
 * Always return a raster logo URL for Flutter (Image.network can't display SVG).
 * Prefer clearbit/google from logoUrls; else non-SVG logoUrl; else build Clearbit from domain.
 */
function getRasterLogoUrl(cu: CreditUnionData | null): string | undefined {
  if (!cu) return undefined
  const main = cu.logoUrl
  const raster =
    cu.logoUrls?.clearbit ||
    cu.logoUrls?.google ||
    (main && !isSvgUrl(main) ? main : undefined)
  if (raster) return raster
  const domain = domainFromCu(cu)
  if (domain) return getClearbitLogoUrl(domain)
  return main || undefined
}

/**
 * Single Flutter app with tenant config (MX app). Talks to Screen Inspector and 16-tier Config
 * via InspectorConfigBridge: host sends NAVIGATE(screenId), app can post SCREEN_VIEW(screenId, route).
 */
function getMxAppUrl(cu: CreditUnionData | null): string {
  // Use /mx-app/index.html so Next.js serves the static Flutter app (public/mx-app/index.html).
  // Pass a raster logo URL so Flutter can show it (no SVG).
  const base = "/mx-app/index.html"
  if (!cu?.id) return base
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const params = new URLSearchParams()
  params.set("tenant", cu.id)
  params.set("configBase", origin)
  if (cu.charter) params.set("charter", cu.charter)
  const logo = getRasterLogoUrl(cu)
  if (logo) params.set("logo", logo)
  return `${base}?${params.toString()}`
}

interface DualFlutterStudioShellProps {
  cu: CreditUnionData | null
}

export function DualFlutterStudioShell({ cu }: DualFlutterStudioShellProps) {
  const [maximized, setMaximized] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { selectedScreenId, setSelectedScreenId } = useInspectorConfigBridge()

  // Send CONFIG_OVERRIDE with raster logo (clearbit/google) so Flutter can display it; app name from dropdown
  const sendConfigOverride = useCallback(() => {
    const win = iframeRef.current?.contentWindow
    if (!win || !cu) return
    win.postMessage(
      {
        source: "host",
        type: "CONFIG_OVERRIDE",
        logoUrl: getRasterLogoUrl(cu) || undefined,
        appName: cu.displayName || cu.name || undefined,
      },
      "*"
    )
  }, [cu])

  useEffect(() => {
    if (!cu) return
    sendConfigOverride()
    const t1 = setTimeout(sendConfigOverride, 100)
    const t2 = setTimeout(sendConfigOverride, 400)
    const t3 = setTimeout(sendConfigOverride, 900)
    const t4 = setTimeout(sendConfigOverride, 2500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [cu, sendConfigOverride])

  // Send NAVIGATE to Dart app when bridge selectedScreenId changes
  useEffect(() => {
    if (!selectedScreenId || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(
      { source: "host", type: "NAVIGATE", screenId: selectedScreenId },
      "*"
    )
  }, [selectedScreenId])

  // Listen for SCREEN_VIEW from Dart app so Inspector/Config stay in sync
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const d = event.data
      if (d?.source === "mx-app" && d?.type === "SCREEN_VIEW" && typeof d.screenId === "string") {
        setSelectedScreenId(d.screenId)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [setSelectedScreenId])

  return (
    <div className="dual-studio flex flex-col min-h-[calc(100vh-8rem)] h-full bg-[#0a0a0a]">
      <header className="dual-studio-nav shrink-0 flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-[#141414]">
        <div className="flex items-center gap-2 text-sm font-medium text-white/90">
          {cu ? (
            <CULogoImage cu={cu} size={28} className="rounded-lg shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-white/10 shrink-0" />
          )}
          <span>Dual Studio</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <nav className="flex items-center gap-1">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white/90 text-sm">
            <Smartphone className="h-3.5 w-3.5" />
            MX App (tenant config)
          </span>
        </nav>
        <p className="ml-auto text-[10px] text-white/40">Syncs with Screen Inspector &amp; Config</p>
      </header>

      <div className="dual-studio-apps flex-1 flex gap-6 items-center justify-center p-6 min-h-0 overflow-auto">
        <div
          className={`dual-studio-window shrink-0 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 shadow-2xl transition-all ${
            maximized ? "fixed inset-4 z-[100] w-auto h-auto" : "w-[420px] h-[800px]"
          }`}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#2d2d2d] border-b border-black/30">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#e0443e]" />
              <span className="w-3 h-3 rounded-full bg-[#dea123]" />
              <button
                type="button"
                className="w-3 h-3 rounded-full bg-[#1aab29] hover:opacity-80"
                onClick={() => setMaximized(!maximized)}
                title={maximized ? "Restore" : "Maximize"}
              />
            </div>
            <span className="flex-1 text-center text-[13px] font-medium text-white/85">
              MX App
            </span>
            <div className="w-[52px]" />
          </div>
          <div className="h-[calc(100%-45px)] bg-black">
            <iframe
              ref={iframeRef}
              src={getMxAppUrl(cu)}
              className="w-full h-full border-0 block"
              title="MX App (tenant config)"
              allow="clipboard-read; clipboard-write"
              onLoad={() => {
                setTimeout(sendConfigOverride, 50)
                setTimeout(sendConfigOverride, 300)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
