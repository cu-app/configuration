"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Settings,
  Palette,
  Smartphone,
  Monitor,
  Info
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface AppBuilderStudioProps {
  cu: CreditUnionData
  mode?: "preview" | "design-system" | "full"
}

interface CursorStep {
  x: number
  y: number
  action: "move" | "click" | "wait"
  duration: number
}

// Demo sequence for animated cursor
const memberJourneySteps: CursorStep[] = [
  { x: 50, y: 50, action: "move", duration: 500 },
  { x: 12, y: 92, action: "click", duration: 800 },
  { x: 12, y: 92, action: "wait", duration: 1200 },
  { x: 30, y: 92, action: "click", duration: 700 },
  { x: 30, y: 92, action: "wait", duration: 1200 },
  { x: 50, y: 92, action: "click", duration: 700 },
  { x: 50, y: 92, action: "wait", duration: 1200 },
  { x: 70, y: 92, action: "click", duration: 700 },
  { x: 70, y: 92, action: "wait", duration: 1200 },
  { x: 88, y: 92, action: "click", duration: 700 },
]

export function AppBuilderStudio({ cu, mode = "full" }: AppBuilderStudioProps) {
  const [leftMaximized, setLeftMaximized] = useState(false)
  const [rightMaximized, setRightMaximized] = useState(false)
  const [showDemoControls, setShowDemoControls] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeDemo, setActiveDemo] = useState<"left" | "right" | null>(null)
  
  const leftIframeRef = useRef<HTMLIFrameElement>(null)
  const rightIframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for messages from the design system (left) app
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === "design-system") {
        // Forward theme/config changes to the preview app (right)
        const rightIframe = rightIframeRef.current
        if (rightIframe?.contentWindow) {
          rightIframe.contentWindow.postMessage({
            source: "host",
            type: "THEME_UPDATE",
            payload: event.data.payload
          }, "*")
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  // Keyboard listener for demo toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        setShowDemoControls(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const startDemo = (side: "left" | "right") => {
    setActiveDemo(side)
    setIsPlaying(true)
  }

  const handleDemoComplete = () => {
    setIsPlaying(false)
    setActiveDemo(null)
  }

  // Build iframe URLs with CU context
  const designSystemUrl = `/cu-ui-studio/flutter/index.html`
  const previewUrl = `/cu-ui-studio/preview/index.html`
  // Real Flutter MX app — fetches config from /api/config/[tenantId], shows tenant logo
  const mxAppUrl =
    typeof window !== "undefined"
      ? `/mx-app/?tenant=${encodeURIComponent(cu.id)}&configBase=${encodeURIComponent(window.location.origin)}`
      : "/mx-app/"

  if (mode === "preview") {
    // Real Flutter .dart app — forkable repo, not a mock
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-background p-6">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">MX App Preview</h2>
            <p className="text-muted-foreground">
              Flutter app · {cu.displayName} · tenant: {cu.id}
            </p>
            <Badge variant="secondary" className="gap-1">
              <Smartphone className="h-3 w-3" />
              cu_mx_app (Flutter)
            </Badge>
          </div>
          <div className="flex justify-center">
            <PhoneFrame title="MX App" maximized={false}>
              <iframe
                ref={rightIframeRef}
                src={mxAppUrl}
                className="w-full h-full border-0"
                title="MX App — Flutter"
              />
            </PhoneFrame>
          </div>
        </div>
      </div>
    )
  }

  if (mode === "design-system") {
    // Single design system mode
    return (
      <div className="h-full w-full">
        <iframe
          ref={leftIframeRef}
          src={designSystemUrl}
          className="w-full h-full border-0"
          title="Design System"
        />
      </div>
    )
  }

  // Full dual-phone mode
  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute rounded-full blur-[100px]"
          style={{
            top: "-160px",
            right: "20%",
            width: "320px",
            height: "320px",
            background: "rgba(168, 85, 247, 0.2)",
          }}
        />
        <div 
          className="absolute rounded-full blur-[100px]"
          style={{
            bottom: "-160px",
            left: "-160px",
            width: "320px",
            height: "320px",
            background: "rgba(59, 130, 246, 0.2)",
          }}
        />
        <div 
          className="absolute rounded-full blur-[100px]"
          style={{
            bottom: "20%",
            right: "-100px",
            width: "280px",
            height: "280px",
            background: "rgba(20, 184, 166, 0.15)",
          }}
        />
        {/* Dot pattern */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: cu.primaryColor }}
          >
            {cu.displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-white font-semibold">{cu.displayName}</h1>
            <p className="text-white/50 text-xs">App Builder Studio</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showDemoControls && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => startDemo("left")}
                disabled={isPlaying}
              >
                {isPlaying && activeDemo === "left" ? (
                  <><Pause className="h-3 w-3 mr-1" /> Playing...</>
                ) : (
                  <><Play className="h-3 w-3 mr-1" /> Demo Left</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => startDemo("right")}
                disabled={isPlaying}
              >
                {isPlaying && activeDemo === "right" ? (
                  <><Pause className="h-3 w-3 mr-1" /> Playing...</>
                ) : (
                  <><Play className="h-3 w-3 mr-1" /> Demo Right</>
                )}
              </Button>
            </>
          )}
          <Badge variant="outline" className="text-white/60 border-white/20">
            Press D for demo controls
          </Badge>
        </div>
      </div>

      {/* Dual phone frames */}
      <div className="flex-1 flex items-center justify-center gap-6 p-6 relative z-10">
        {/* Left - Design System */}
        <PhoneFrame 
          title="Design System" 
          maximized={leftMaximized}
          onMaximize={() => setLeftMaximized(!leftMaximized)}
        >
          <iframe
            ref={leftIframeRef}
            src={designSystemUrl}
            className="w-full h-full border-0"
            title="Design System"
          />
          {activeDemo === "left" && (
            <AnimatedCursor
              isPlaying={isPlaying}
              steps={memberJourneySteps}
              onComplete={handleDemoComplete}
            />
          )}
        </PhoneFrame>

        {/* Right - Live Preview */}
        <PhoneFrame 
          title="Live Preview" 
          maximized={rightMaximized}
          onMaximize={() => setRightMaximized(!rightMaximized)}
        >
          <iframe
            ref={rightIframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Live Preview"
          />
          {activeDemo === "right" && (
            <AnimatedCursor
              isPlaying={isPlaying}
              steps={memberJourneySteps}
              onComplete={handleDemoComplete}
            />
          )}
        </PhoneFrame>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-3 text-white/40 text-sm">
        Built with Flutter • Design System controls Live Preview via postMessage
      </div>
    </div>
  )
}

// Phone frame component
interface PhoneFrameProps {
  title: string
  maximized?: boolean
  onMaximize?: () => void
  children: React.ReactNode
}

function PhoneFrame({ title, maximized, onMaximize, children }: PhoneFrameProps) {
  const frameStyle = maximized
    ? "fixed inset-4 z-50"
    : "w-[420px] h-[800px]"

  return (
    <div 
      className={`${frameStyle} rounded-xl overflow-hidden transition-all duration-300`}
      style={{
        background: "linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
      }}
    >
      {/* Title bar */}
      <div 
        className="flex items-center gap-2 px-4 py-3"
        style={{
          background: "linear-gradient(180deg, #3d3d3d 0%, #2d2d2d 100%)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#dea123]" />
          <button 
            className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] hover:brightness-110 transition-all"
            onClick={onMaximize}
          />
        </div>
        <div className="flex-1 text-center text-sm font-medium text-white/85">
          {title}
        </div>
        <div className="w-[52px]" />
      </div>

      {/* Content */}
      <div className="relative bg-black" style={{ height: "calc(100% - 45px)" }}>
        {children}
      </div>
    </div>
  )
}

// Animated cursor component
interface AnimatedCursorProps {
  isPlaying: boolean
  steps: CursorStep[]
  onComplete: () => void
}

function AnimatedCursor({ isPlaying, steps, onComplete }: AnimatedCursorProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    if (!isPlaying) return

    let stepIndex = 0
    let timeoutId: NodeJS.Timeout

    const runStep = async () => {
      if (stepIndex >= steps.length) {
        onComplete()
        return
      }

      const step = steps[stepIndex]
      
      if (step.action === "move" || step.action === "click") {
        setPosition({ x: step.x, y: step.y })
        
        if (step.action === "click") {
          timeoutId = setTimeout(() => {
            setIsClicking(true)
            setTimeout(() => {
              setIsClicking(false)
              stepIndex++
              runStep()
            }, 250)
          }, step.duration)
        } else {
          timeoutId = setTimeout(() => {
            stepIndex++
            runStep()
          }, step.duration)
        }
      } else if (step.action === "wait") {
        timeoutId = setTimeout(() => {
          stepIndex++
          runStep()
        }, step.duration)
      }
    }

    runStep()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isPlaying, steps, onComplete])

  if (!isPlaying) return null

  return (
    <div
      className="absolute z-50 pointer-events-none transition-all duration-500"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : 1})`,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))" }}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
          fill="white"
          stroke="black"
          strokeWidth="1.5"
        />
      </svg>
      
      {isClicking && (
        <div 
          className="absolute top-1/2 left-1/2 w-10 h-10 -mt-5 -ml-5 rounded-full animate-ping"
          style={{ background: "rgba(59, 130, 246, 0.4)" }}
        />
      )}
    </div>
  )
}

export default AppBuilderStudio
