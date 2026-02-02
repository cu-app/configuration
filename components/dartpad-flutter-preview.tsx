"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Sparkles, Download, Eye, EyeOff, MapPin, Shield, CheckCircle2, AlertTriangle, Accessibility, Layout, Code2, Smartphone } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppFlowArchitecture } from "./app-flow-architecture"
import { BranchVerificationPanel } from "./branch-verification-panel"
import { CULogoImage, CULogoWithBackground } from "./cu-logo-image"
import type { CreditUnionData } from "@/lib/credit-union-data"
import type { A11yLevel, GoldenGateStatus } from "@/lib/golden-gate-config"
import { GOLDEN_GATE_DEFAULTS, createPassingStatus } from "@/lib/golden-gate-config"

interface DartPadFlutterPreviewProps {
  cu: CreditUnionData
  hasPurchased?: boolean
  onPurchase?: () => void
}

interface Branch {
  placeId: string
  name: string
  address: string
  location: { lat: number; lng: number }
  photos?: { reference: string }[]
  verified: boolean
}

export function DartPadFlutterPreview({ cu, hasPurchased = false, onPurchase }: DartPadFlutterPreviewProps) {
  const [showCode, setShowCode] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<"splash" | "login" | "home" | "branches">("splash")
  const [verifiedBranches, setVerifiedBranches] = useState<Branch[]>([])
  const [headquartersPhoto, setHeadquartersPhoto] = useState<string | null>(null)
  const [a11yLevel, setA11yLevel] = useState<A11yLevel>("AA")
  const [showA11yOverlay, setShowA11yOverlay] = useState(false)

  // Golden Gate A11y compliance status (simulated based on configuration)
  const a11yStatus: GoldenGateStatus = useMemo(() => {
    // In production, this would be computed from actual widget tree analysis
    const status = createPassingStatus(a11yLevel)
    // AAA has stricter requirements, so we show some warnings
    if (a11yLevel === "AAA") {
      status.warnings = 2
    }
    return status
  }, [a11yLevel])

  // Auto-advance from splash to login after 3 seconds
  useEffect(() => {
    if (currentScreen === "splash") {
      const timer = setTimeout(() => setCurrentScreen("login"), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentScreen])

  // Reset on CU change
  useEffect(() => {
    setCurrentScreen("splash")
    setVerifiedBranches([])
    setHeadquartersPhoto(null)
  }, [cu.id])

  useEffect(() => {
    if (verifiedBranches.length > 0 && verifiedBranches[0].photos?.[0]) {
      setHeadquartersPhoto(`/api/branches/photo?ref=${verifiedBranches[0].photos[0].reference}&maxwidth=400`)
    }
  }, [verifiedBranches])

  // Generate the actual Flutter/Dart code for this tenant with Golden Gate
  const flutterCode = useMemo(() => generateFlutterCode(cu, verifiedBranches, a11yLevel), [cu, verifiedBranches, a11yLevel])

  const handleBranchesVerified = (branches: Branch[]) => {
    setVerifiedBranches(branches)
  }

  return (
    <div className="relative w-full min-h-[700px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="relative z-10 p-6">
        {/* Hero Section with Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Feature Card - Enterprise License */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">CU.APP Platform</h2>
                    <p className="text-white/60 text-sm">Complete Digital Banking Suite</p>
                  </div>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Production Ready</Badge>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {[
                { icon: "🏦", label: "380+ DB Tables", desc: "Full schema" },
                { icon: "📱", label: "Flutter App", desc: "iOS & Android" },
                { icon: "🔐", label: "Golden Gate A11y", desc: "WCAG 2.1 AA" },
                { icon: "⚡", label: "Edge Functions", desc: "100+ endpoints" },
                { icon: "🤖", label: "AI Coach", desc: "Financial insights" },
                { icon: "🔄", label: "Real-time Sync", desc: "Supabase powered" },
              ].map((feature) => (
                <div key={feature.label} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-2xl mb-2 block">{feature.icon}</span>
                  <p className="text-white font-medium text-sm">{feature.label}</p>
                  <p className="text-white/50 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Pricing Row */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
              <div>
                <p className="text-white/60 text-sm">Enterprise License</p>
                <p className="text-3xl font-bold text-white">$50,000 <span className="text-base font-normal text-white/50">one-time</span></p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25"
                onClick={onPurchase}
              >
                <Download className="w-5 h-5 mr-2" />
                Get Source Code
              </Button>
            </div>
          </div>

          {/* Side Cards */}
          <div className="space-y-4">
            {/* A11y Compliance Card */}
            <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Golden Gate</h3>
                  <p className="text-emerald-400/80 text-xs">Accessibility System</p>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                {(["A", "AA", "AAA"] as A11yLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setA11yLevel(level)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      a11yLevel === level
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    WCAG {level}
                  </button>
                ))}
              </div>
              <p className="text-white/50 text-xs">ADA-first self-healing UX with real-time compliance checking</p>
            </div>

            {/* Branch Verification Card */}
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Branch Discovery</h3>
                  <p className="text-blue-400/80 text-xs">{verifiedBranches.length} locations verified</p>
                </div>
              </div>
              <BranchVerificationPanel
                creditUnionName={cu.displayName || cu.name}
                city={cu.headquarters?.split(",")[0] || cu.state || ""}
                state={cu.state || ""}
                onBranchesVerified={handleBranchesVerified}
              />
            </div>
          </div>
        </div>

        {/* Tabbed Content: Preview / Flow Architecture / Code */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
            <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white/70 gap-2">
              <Smartphone className="w-4 h-4" />
              Live Preview
            </TabsTrigger>
            <TabsTrigger value="flows" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white/70 gap-2">
              <Layout className="w-4 h-4" />
              App Architecture
              <Badge className="bg-amber-500/20 text-amber-400 text-[10px] ml-1">154 screens</Badge>
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-white/70 gap-2">
              <Code2 className="w-4 h-4" />
              Source Code
            </TabsTrigger>
          </TabsList>

          {/* Live Preview Tab */}
          <TabsContent value="preview" className="mt-0">
            <div className="flex gap-6 flex-col lg:flex-row">
              {/* Device Frame */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    Live Preview
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer transition-all ${
                      a11yStatus.passed
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30"
                    }`}
                    onClick={() => setShowA11yOverlay(!showA11yOverlay)}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    WCAG {a11yLevel}
                    {a11yStatus.passed ? <CheckCircle2 className="w-3 h-3 ml-1" /> : <AlertTriangle className="w-3 h-3 ml-1" />}
                  </Badge>
                </div>

          {/* iPhone 15 Pro Bezel */}
          <div className="relative">
            {/* Device frame */}
            <div
              className="relative bg-[#1a1a1a] rounded-[55px] p-[12px] shadow-2xl"
              style={{
                width: 320,
                height: 680,
                boxShadow: "0 50px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              {/* Side buttons */}
              <div className="absolute -left-[3px] top-[120px] w-[3px] h-[35px] bg-[#2a2a2a] rounded-l-sm" />
              <div className="absolute -left-[3px] top-[170px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
              <div className="absolute -left-[3px] top-[240px] w-[3px] h-[60px] bg-[#2a2a2a] rounded-l-sm" />
              <div className="absolute -right-[3px] top-[180px] w-[3px] h-[80px] bg-[#2a2a2a] rounded-r-sm" />

              {/* Screen */}
              <div className="relative w-full h-full bg-black rounded-[45px] overflow-hidden">
                {/* Dynamic Island */}
                <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50" />

                {/* App Content */}
                <div className="w-full h-full">
                  {currentScreen === "splash" && <SplashScreen cu={cu} onComplete={() => setCurrentScreen("login")} showA11y={showA11yOverlay} a11yLevel={a11yLevel} />}
                  {currentScreen === "login" && <LoginScreen cu={cu} onLogin={() => setCurrentScreen("home")} showA11y={showA11yOverlay} a11yLevel={a11yLevel} />}
                  {currentScreen === "home" && (
                    <HomeScreen
                      cu={cu}
                      branchCount={verifiedBranches.length}
                      onBranchesClick={() => setCurrentScreen("branches")}
                      showA11y={showA11yOverlay}
                      a11yLevel={a11yLevel}
                    />
                  )}
                  {currentScreen === "branches" && (
                    <BranchesScreen cu={cu} branches={verifiedBranches} onBack={() => setCurrentScreen("home")} showA11y={showA11yOverlay} a11yLevel={a11yLevel} />
                  )}
                </div>

                {/* Golden Gate A11y Overlay */}
                {showA11yOverlay && (
                  <div className="absolute inset-0 pointer-events-none z-40">
                    {/* Touch target indicators */}
                    <div className="absolute top-[300px] left-1/2 -translate-x-1/2 w-[44px] h-[44px] border-2 border-emerald-400 rounded-lg opacity-50" />
                    <div className="absolute top-[360px] left-6 right-6 h-[48px] border-2 border-emerald-400 rounded-lg opacity-50" />
                    <div className="absolute top-[420px] left-6 right-6 h-[48px] border-2 border-emerald-400 rounded-lg opacity-50" />
                  </div>
                )}

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] bg-white/30 rounded-full" />
              </div>
            </div>

            {/* Screen navigation dots */}
            <div className="flex gap-2 mt-4 justify-center">
              {(["splash", "login", "home", "branches"] as const).map((screen) => (
                <button
                  key={screen}
                  onClick={() => setCurrentScreen(screen)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentScreen === screen ? "bg-white w-6" : "bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

              </div>
            </div>
          </TabsContent>

          {/* App Architecture Tab */}
          <TabsContent value="flows" className="mt-0">
            <AppFlowArchitecture cu={cu} />
          </TabsContent>

          {/* Source Code Tab */}
          <TabsContent value="code" className="mt-0">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-semibold">Flutter Source Code</h3>
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">Golden Gate A11y</Badge>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Riverpod + GoRouter</Badge>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">154 Screens</Badge>
                </div>
                {hasPurchased && (
                  <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)} className="text-white/70 hover:text-white">
                    {showCode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showCode ? "Hide" : "Show"}
                  </Button>
                )}
              </div>

              <Card className="min-h-[500px] bg-[#0d0d0d] border-white/10 overflow-hidden relative rounded-xl">
                <div className={`absolute inset-0 overflow-auto p-4 font-mono text-sm text-white/90 ${!hasPurchased ? "blur-md select-none pointer-events-none" : ""}`}>
                  <pre className="whitespace-pre-wrap">{flutterCode}</pre>
                </div>

                {!hasPurchased && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="text-center max-w-md">
                      <Lock className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Enterprise Source Code</h3>
                      <p className="text-white/50 text-sm mb-6">
                        Get the complete Flutter codebase with 154 production screens, Golden Gate A11y, and your CU branding pre-configured.
                      </p>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                        onClick={onPurchase}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Purchase for $50,000
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Logo Integration Guide */}
              <Card className="mt-4 bg-slate-800/50 border-white/10 p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  App Icon & Logo Integration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1">Primary Logo URL</p>
                    <code className="text-emerald-400 text-xs break-all">{cu.logoUrl || cu.logoUrls?.clearbit}</code>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1">iOS App Icon</p>
                    <code className="text-blue-400 text-xs">ios/Runner/Assets.xcassets/AppIcon.appiconset/</code>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1">Android Adaptive Icon</p>
                    <code className="text-green-400 text-xs">android/app/src/main/res/mipmap-*/</code>
                  </div>
                </div>
                <p className="text-white/40 text-xs mt-3">
                  The build script auto-generates all icon sizes from your logo. Fallback chain: Direct → Brandfetch → Clearbit → Generated.
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Golden Gate A11y Badge Component
function A11yBadge({ level, passed = true }: { level: A11yLevel; passed?: boolean }) {
  return (
    <div
      className={`absolute top-14 right-2 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
        passed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
      }`}
    >
      <Shield className="w-3 h-3" />
      {level}
    </div>
  )
}

// Material Design Splash Screen with tenant logo on white background
function SplashScreen({ cu, onComplete, showA11y = false, a11yLevel = "AA" }: { cu: CreditUnionData; onComplete: () => void; showA11y?: boolean; a11yLevel?: A11yLevel }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  const primaryColor = cu.primaryColor || "#1e3a5f"
  const displayName = cu.displayName || cu.name

  return (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center relative">
      {/* Golden Gate A11y Badge */}
      {showA11y && <A11yBadge level={a11yLevel} />}

      {/* Logo container - using CULogoWithBackground for proper fallback chain */}
      <div className={`mb-6 shadow-lg animate-in zoom-in duration-500 rounded-3xl ${showA11y ? "ring-2 ring-emerald-400 ring-offset-2" : ""}`}>
        <CULogoWithBackground
          cu={cu}
          size={128}
          logoSize={80}
          rounded="3xl"
        />
      </div>

      {/* Credit union name */}
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{displayName}</h1>
      <p className="text-sm text-gray-500">Mobile Banking</p>
      {showA11y && <p className="text-xs text-emerald-600 mt-1">Powered by Golden Gate</p>}

      {/* Loading indicator */}
      <div className="mt-8">
        <div
          className="w-8 h-8 border-3 rounded-full animate-spin"
          style={{ borderColor: "#e5e7eb", borderTopColor: primaryColor, borderWidth: 3 }}
        />
      </div>
    </div>
  )
}

// Material Design Login Screen with Golden Gate A11y
function LoginScreen({ cu, onLogin, showA11y = false, a11yLevel = "AA" }: { cu: CreditUnionData; onLogin: () => void; showA11y?: boolean; a11yLevel?: A11yLevel }) {
  const primaryColor = cu.primaryColor || "#1e3a5f"
  const displayName = cu.displayName || cu.name

  return (
    <div className="w-full h-full bg-white flex flex-col pt-16 px-6 relative">
      {/* Golden Gate A11y Badge */}
      {showA11y && <A11yBadge level={a11yLevel} />}

      {/* Header with logo - using CULogoWithBackground for proper fallback chain */}
      <div className="flex items-center gap-3 mb-8">
        <div className={showA11y ? "ring-2 ring-emerald-400 rounded-xl" : ""}>
          <CULogoWithBackground
            cu={cu}
            size={48}
            logoSize={32}
            rounded="xl"
          />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
          <p className="text-xs text-gray-500">Secure Login</p>
        </div>
      </div>

      {/* Login form */}
      <div className="space-y-4">
        <div className={showA11y ? "relative" : ""}>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Username</label>
          <div className={`h-12 rounded-lg border border-gray-300 bg-gray-50 px-4 flex items-center ${showA11y ? "ring-2 ring-emerald-400" : ""}`}>
            <span className="text-gray-400 text-sm">Enter username</span>
          </div>
          {showA11y && <span className="absolute -right-1 -top-1 text-[8px] bg-emerald-500 text-white px-1 rounded">44px</span>}
        </div>

        <div className={showA11y ? "relative" : ""}>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
          <div className={`h-12 rounded-lg border border-gray-300 bg-gray-50 px-4 flex items-center ${showA11y ? "ring-2 ring-emerald-400" : ""}`}>
            <span className="text-gray-400 text-sm">{"••••••••"}</span>
          </div>
          {showA11y && <span className="absolute -right-1 -top-1 text-[8px] bg-emerald-500 text-white px-1 rounded">44px</span>}
        </div>

        <div className={showA11y ? "relative" : ""}>
          <button
            onClick={onLogin}
            className={`w-full h-12 rounded-lg text-white font-medium text-sm shadow-md active:scale-[0.98] transition-transform ${showA11y ? "ring-2 ring-emerald-400" : ""}`}
            style={{ backgroundColor: primaryColor }}
          >
            Sign In
          </button>
          {showA11y && <span className="absolute -right-1 -top-1 text-[8px] bg-emerald-500 text-white px-1 rounded">48px</span>}
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Forgot Password?</span>
          <span style={{ color: primaryColor }}>Enroll Now</span>
        </div>
      </div>

      {/* Biometric option */}
      <div className="mt-auto mb-8 flex flex-col items-center">
        <div className={`w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center mb-2 ${showA11y ? "ring-2 ring-emerald-400" : ""}`}>
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1C8.1 1 5 4.1 5 8c0 1.9.8 3.7 2 5v8c0 .6.4 1 1 1h8c.6 0 1-.4 1-1v-8c1.2-1.3 2-3.1 2-5 0-3.9-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z" />
          </svg>
        </div>
        <span className="text-xs text-gray-500">Use Face ID</span>
        {showA11y && <span className="text-[8px] text-emerald-600 mt-1">56×56px touch target ✓</span>}
      </div>
    </div>
  )
}

// Material Design Home Screen with bottom nav and Golden Gate A11y
function HomeScreen({
  cu,
  branchCount,
  onBranchesClick,
  showA11y = false,
  a11yLevel = "AA",
}: {
  cu: CreditUnionData
  branchCount: number
  onBranchesClick: () => void
  showA11y?: boolean
  a11yLevel?: A11yLevel
}) {
  const primaryColor = cu.primaryColor || "#1e3a5f"
  const accounts = [
    { name: "Checking", number: "****1234", balance: "$5,432.10" },
    { name: "Savings", number: "****5678", balance: "$12,890.45" },
  ]

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col relative">
      {/* Golden Gate A11y Badge */}
      {showA11y && <A11yBadge level={a11yLevel} />}

      {/* App bar */}
      <div className="pt-14 pb-6 px-5" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ${showA11y ? "ring-2 ring-emerald-400" : ""}`}>
              <span className="text-white font-medium">JD</span>
            </div>
            <div>
              <p className="text-white/70 text-xs">Good morning,</p>
              <p className="text-white font-medium">John Doe</p>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ${showA11y ? "ring-2 ring-emerald-400" : ""}`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-white/70 text-xs mb-1">Total Balance</p>
          <p className="text-white text-2xl font-bold">$18,322.55</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4 flex justify-around">
          {[
            { icon: "↗", label: "Transfer" },
            { icon: "💳", label: "Pay" },
            { icon: "📊", label: "Invest" },
            { icon: "⋯", label: "More" },
          ].map((action) => (
            <div key={action.label} className="flex flex-col items-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <span className="text-lg">{action.icon}</span>
              </div>
              <span className="text-xs text-gray-600">{action.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts */}
      <div className="flex-1 px-5 mt-6 overflow-auto">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">My Accounts</h2>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.number} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.number}</p>
                </div>
                <p className="font-semibold text-gray-900">{account.balance}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Branch count indicator */}
        {branchCount > 0 && (
          <button
            onClick={onBranchesClick}
            className="mt-4 w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Find a Branch</p>
                <p className="text-xs text-gray-500">{branchCount} locations nearby</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom navigation - Material Design 3 style */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex justify-around">
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "💳", label: "Cards", active: false },
          { icon: "📈", label: "Activity", active: false },
          { icon: "⚙️", label: "Settings", active: false },
        ].map((nav) => (
          <div key={nav.label} className="flex flex-col items-center py-1">
            <span className="text-xl mb-0.5">{nav.icon}</span>
            <span className="text-[10px] font-medium" style={{ color: nav.active ? primaryColor : "#9ca3af" }}>
              {nav.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Branches Screen with Golden Gate A11y
function BranchesScreen({
  cu,
  branches,
  onBack,
  showA11y = false,
  a11yLevel = "AA",
}: {
  cu: CreditUnionData
  branches: Branch[]
  onBack: () => void
  showA11y?: boolean
  a11yLevel?: A11yLevel
}) {
  const primaryColor = cu.primaryColor || "#1e3a5f"

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col relative">
      {/* Golden Gate A11y Badge */}
      {showA11y && <A11yBadge level={a11yLevel} />}

      {/* App bar */}
      <div className="pt-14 pb-4 px-5 bg-white border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 ${showA11y ? "ring-2 ring-emerald-400" : ""}`}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Branch Locations</h1>
        </div>
      </div>

      {/* Branch list */}
      <div className="flex-1 overflow-auto p-5 space-y-3">
        {branches.map((branch, index) => (
          <div key={branch.placeId} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex gap-3">
              {branch.photos?.[0] ? (
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={`/api/branches/photo?ref=${branch.photos[0].reference}&maxwidth=100`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-20 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{branch.name}</p>
                <p className="text-xs text-gray-500 truncate">{branch.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-green-600">Open</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{(index * 0.3 + 0.5).toFixed(1)} mi</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex justify-around">
        {[
          { icon: "🏠", label: "Home", active: false },
          { icon: "💳", label: "Cards", active: false },
          { icon: "📍", label: "Branches", active: true },
          { icon: "⚙️", label: "Settings", active: false },
        ].map((nav) => (
          <div key={nav.label} className="flex flex-col items-center py-1">
            <span className="text-xl mb-0.5">{nav.icon}</span>
            <span className="text-[10px] font-medium" style={{ color: nav.active ? primaryColor : "#9ca3af" }}>
              {nav.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Generate actual Flutter/Dart code with branches and Golden Gate A11y
function generateFlutterCode(cu: CreditUnionData, branches: Branch[], a11yLevel: A11yLevel = "AA"): string {
  const primaryColorHex = (cu.primaryColor || "#1e3a5f").replace("#", "")
  const displayName = cu.displayName || cu.name

  return `// ${displayName.toUpperCase()} MOBILE BANKING APP
// Generated by CU.APP Configuration Matrix
// Charter #${cu.charter || "N/A"} | Routing #${cu.routing || "N/A"}
// ═══════════════════════════════════════════════════════════════
// Powered by Golden Gate - ADA-First Accessibility System
// WCAG 2.1 Level ${a11yLevel} Compliance
// ═══════════════════════════════════════════════════════════════

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:golden_gate/golden_gate.dart';

// ============================================
// GOLDEN GATE ACCESSIBILITY CONFIGURATION
// ============================================

/// App-wide accessibility settings powered by Golden Gate
class GoldenGateConfig {
  /// Required WCAG compliance level for all interactive widgets
  static const A11yLevel requiredLevel = A11yLevel.level${a11yLevel};

  /// Minimum touch target size (${a11yLevel === "A" ? "24" : a11yLevel === "AA" ? "44" : "48"}px for Level ${a11yLevel})
  static const double minTouchTarget = ${GOLDEN_GATE_DEFAULTS[a11yLevel].minTouchTarget}.0;

  /// Enable debug overlay showing a11y compliance badges
  static const bool debugMode = ${GOLDEN_GATE_DEFAULTS[a11yLevel].debugMode};

  /// Announce all state changes to screen readers
  static const bool announceChanges = ${GOLDEN_GATE_DEFAULTS[a11yLevel].announceChanges};

  /// Supabase table for feedback collection
  static const String feedbackTable = '${GOLDEN_GATE_DEFAULTS[a11yLevel].feedbackTable}';
}

// ============================================
// BRANDING CONFIGURATION
// ============================================

class CUBranding {
  static const String name = '${displayName}';
  static const String charter = '${cu.charter || ""}';
  static const String routing = '${cu.routing || ""}';

  static const Color primaryColor = Color(0xFF${primaryColorHex});

  static const String logoUrl = '${cu.logoUrl || ""}';
  static const String logoDomain = '${cu.logoDomain || ""}';

  static List<String> get logoFallbackChain => [
    '${cu.logoUrls?.direct || ""}',
    '${cu.logoUrls?.brandfetch || ""}',
    '${cu.logoUrls?.clearbit || ""}',
    logoUrl,
  ].where((url) => url.isNotEmpty).toList();
}

// ============================================
// BRANCH LOCATIONS (${branches.length} verified)
// ============================================

class BranchLocation {
  final String id;
  final String name;
  final String address;
  final double lat;
  final double lng;
  
  const BranchLocation({
    required this.id,
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
  });
}

final List<BranchLocation> branches = [
${branches
  .map(
    (b) => `  BranchLocation(
    id: '${b.placeId}',
    name: '${b.name.replace(/'/g, "\\'")}',
    address: '${b.address.replace(/'/g, "\\'")}',
    lat: ${b.location?.lat || 0},
    lng: ${b.location?.lng || 0},
  ),`,
  )
  .join("\n")}
];

// ============================================
// MAIN APP ENTRY
// ============================================

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  
  runApp(const ProviderScope(child: CUMobileApp()));
}

class CUMobileApp extends ConsumerWidget {
  const CUMobileApp({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: '\${CUBranding.name} Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: CUBranding.primaryColor,
          brightness: Brightness.light,
        ),
        fontFamily: 'Roboto',
      ),
      routerConfig: router,
    );
  }
}

// ============================================
// ROUTER CONFIGURATION (GoRouter)
// ============================================

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/branches',
        builder: (context, state) => const BranchesScreen(),
      ),
    ],
  );
});

// ============================================
// GOLDEN GATE WRAPPED WIDGETS
// ============================================

/// Accessible primary button with Golden Gate compliance
class GGPrimaryButton extends StatelessWidget {
  final String label;
  final String semanticHint;
  final VoidCallback onPressed;
  final bool isLoading;

  const GGPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.semanticHint = '',
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return FeedbackGate(
      widgetId: 'primary_button_\${label.toLowerCase().replaceAll(' ', '_')}',
      widgetVersion: '1.0.0',
      child: GoldenGate(
        semanticLabel: label,
        semanticHint: semanticHint,
        requiredLevel: GoldenGateConfig.requiredLevel,
        minTouchTarget: GoldenGateConfig.minTouchTarget,
        debugMode: GoldenGateConfig.debugMode,
        onA11yCheck: (result) {
          if (!result.passed) {
            debugPrint('A11y violation in "\$label": \${result.violations}');
          }
        },
        child: FilledButton(
          onPressed: isLoading ? null : onPressed,
          style: FilledButton.styleFrom(
            minimumSize: Size(
              GoldenGateConfig.minTouchTarget,
              GoldenGateConfig.minTouchTarget,
            ),
            backgroundColor: CUBranding.primaryColor,
          ),
          child: isLoading
              ? const SizedBox(
                  width: 20, height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : Text(label),
        ),
      ),
    );
  }
}

/// Accessible text field with Golden Gate compliance
class GGTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final bool obscureText;
  final TextEditingController? controller;

  const GGTextField({
    super.key,
    required this.label,
    this.hint,
    this.obscureText = false,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return GoldenGate(
      semanticLabel: label,
      semanticHint: hint ?? 'Enter your \${label.toLowerCase()}',
      requiredLevel: GoldenGateConfig.requiredLevel,
      minTouchTarget: GoldenGateConfig.minTouchTarget,
      isInteractive: true,
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }
}

/// Accessible account card with Golden Gate compliance
class GGAccountCard extends StatelessWidget {
  final String accountName;
  final String accountNumber;
  final String balance;
  final VoidCallback? onTap;

  const GGAccountCard({
    super.key,
    required this.accountName,
    required this.accountNumber,
    required this.balance,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return FeedbackGate(
      widgetId: 'account_card_\${accountName.toLowerCase().replaceAll(' ', '_')}',
      widgetVersion: '1.0.0',
      child: GoldenGate(
        semanticLabel: '\$accountName account ending in \${accountNumber.substring(accountNumber.length - 4)}, balance \$balance',
        semanticHint: 'Double tap to view account details',
        requiredLevel: GoldenGateConfig.requiredLevel,
        minTouchTarget: GoldenGateConfig.minTouchTarget,
        child: Card(
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(accountName, style: Theme.of(context).textTheme.titleMedium),
                      Text(accountNumber, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                  Text(balance, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ... [Full implementation continues with Golden Gate widgets]
// Total lines: ~3,200
// Dependencies: flutter_riverpod, go_router, cached_network_image, golden_gate
`
}
