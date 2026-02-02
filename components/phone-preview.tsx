"use client"

import { useState, useEffect } from "react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PhonePreviewProps {
  cu: CreditUnionData
}

export function PhonePreview({ cu }: PhonePreviewProps) {
  const [logoError, setLogoError] = useState(false)
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>("")
  const [previewMode, setPreviewMode] = useState<"home" | "splash">("home")
  const [splashAnimating, setSplashAnimating] = useState(false)

  // Reset logo state when CU changes
  useEffect(() => {
    setLogoError(false)
    // Try direct URL first, then brandfetch, then clearbit
    setCurrentLogoUrl(cu.logoUrls.direct || cu.logoUrls.brandfetch || cu.logoUrls.clearbit)
  }, [cu])

  function handleLogoError() {
    // Fallback chain: direct -> brandfetch -> clearbit -> google -> error
    if (currentLogoUrl === cu.logoUrls.direct && cu.logoUrls.brandfetch) {
      setCurrentLogoUrl(cu.logoUrls.brandfetch)
    } else if (currentLogoUrl === cu.logoUrls.brandfetch && cu.logoUrls.clearbit) {
      setCurrentLogoUrl(cu.logoUrls.clearbit)
    } else if (currentLogoUrl === cu.logoUrls.clearbit && cu.logoUrls.google) {
      setCurrentLogoUrl(cu.logoUrls.google)
    } else {
      setLogoError(true)
    }
  }

  function handleShowSplash() {
    setPreviewMode("splash")
    setSplashAnimating(true)
    // Auto-transition to home after splash animation
    setTimeout(() => {
      setSplashAnimating(false)
      setPreviewMode("home")
    }, 3000)
  }

  const monochromeStyle = { filter: "grayscale(100%) contrast(1.2) brightness(0)" }
  const whiteMonoStyle = { filter: "grayscale(100%) contrast(1.2) brightness(100)" }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">App Preview</h2>
          <p className="text-sm text-muted-foreground">
            See how {cu.displayName}&apos;s config renders in the member app
          </p>
        </div>
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "home" | "splash")}>
          <TabsList className="h-8">
            <TabsTrigger value="home" className="text-xs px-3 h-6">
              Home Screen
            </TabsTrigger>
            <TabsTrigger value="splash" className="text-xs px-3 h-6" onClick={handleShowSplash}>
              Splash Screen
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
        {/* iPhone Bezel */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {previewMode === "splash" ? "Splash Screen" : "Home Screen"}
              </CardTitle>
              <Badge variant="outline">iOS</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center py-4 md:py-8">
            {/* Realistic iPhone 15 Pro bezel */}
            <div className="relative">
              {/* Outer frame */}
              <div
                className="w-[260px] md:w-[290px] h-[530px] md:h-[590px] rounded-[45px] md:rounded-[50px] p-[3px] shadow-2xl"
                style={{ background: "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)" }}
              >
                {/* Inner bezel */}
                <div className="w-full h-full bg-black rounded-[42px] md:rounded-[47px] p-[8px] md:p-[10px]">
                  {/* Screen */}
                  <div
                    className="w-full h-full rounded-[35px] md:rounded-[38px] overflow-hidden relative transition-all duration-500"
                    style={{
                      backgroundColor: previewMode === "splash" ? cu.primaryColor : undefined,
                      background:
                        previewMode === "splash"
                          ? `linear-gradient(180deg, ${cu.primaryColor} 0%, ${cu.primaryColor}dd 100%)`
                          : "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
                    }}
                  >
                    {/* Dynamic Island */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] md:w-[100px] h-[28px] md:h-[32px] bg-black rounded-full flex items-center justify-center gap-2 z-20">
                      <div className="w-2 h-2 rounded-full bg-slate-800" />
                      <div className="w-3 h-3 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                    </div>

                    {previewMode === "splash" ? (
                      // Splash Screen Preview
                      <div className="h-full flex flex-col items-center justify-center px-6">
                        {/* Animated Logo Container */}
                        <div
                          className={`
                            w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white shadow-2xl 
                            flex items-center justify-center p-4
                            ${splashAnimating ? "animate-pulse" : ""}
                          `}
                          style={{
                            animation: splashAnimating ? "splashIn 0.8s ease-out" : undefined,
                          }}
                        >
                          {!logoError ? (
                            <img
                              src={currentLogoUrl || "/placeholder.svg"}
                              alt={cu.displayName}
                              className="w-20 h-20 md:w-24 md:h-24 object-contain"
                              onError={handleLogoError}
                            />
                          ) : (
                            <span className="font-bold text-3xl md:text-4xl" style={{ color: cu.primaryColor }}>
                              {cu.displayName.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* CU Name */}
                        <h1 className="text-white text-xl md:text-2xl font-bold mt-6 text-center">{cu.displayName}</h1>
                        <p className="text-white/70 text-sm mt-1">Mobile Banking</p>

                        {/* Loading Spinner */}
                        <div className="mt-8">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        </div>

                        {/* Powered By */}
                        <p className="absolute bottom-6 text-white/40 text-xs">Powered by CU.APP</p>
                      </div>
                    ) : (
                      // Home Screen Preview (existing code)
                      <>
                        {/* Status bar */}
                        <div className="h-14 flex items-end justify-between px-6 md:px-7 pb-1">
                          <span className="text-xs font-semibold text-foreground">9:41</span>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3C7.5 3 3.75 4.5 1 7l2 2c2.25-2 5.25-3 9-3s6.75 1 9 3l2-2c-2.75-2.5-6.5-4-11-4zm0 6c-2.75 0-5.25.75-7 2l2 2c1.25-.75 3-1.25 5-1.25s3.75.5 5 1.25l2-2c-1.75-1.25-4.25-2-7-2zm0 6c-1.5 0-2.75.5-4 1.25L12 21l4-4.75c-1.25-.75-2.5-1.25-4-1.25z" />
                            </svg>
                            <span className="text-[10px] font-medium">5G</span>
                            <div className="w-6 h-3 border border-current rounded-sm relative ml-1">
                              <div
                                className="absolute top-0.5 left-0.5 bottom-0.5 bg-current rounded-sm"
                                style={{ width: "80%" }}
                              />
                              <div className="absolute -right-0.5 top-1 w-0.5 h-1 bg-current rounded-r" />
                            </div>
                          </div>
                        </div>

                        {/* App Grid */}
                        <div className="px-4 md:px-5 pt-2">
                          <div className="grid grid-cols-4 gap-x-3 md:gap-x-4 gap-y-4 md:gap-y-5">
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className="w-[52px] md:w-[60px] h-[52px] md:h-[60px] rounded-[12px] md:rounded-[14px] flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: cu.primaryColor }}
                              >
                                {!logoError ? (
                                  <img
                                    src={currentLogoUrl || "/placeholder.svg"}
                                    alt={cu.displayName}
                                    className="w-8 md:w-10 h-8 md:h-10 object-contain"
                                    style={whiteMonoStyle}
                                    onError={handleLogoError}
                                  />
                                ) : (
                                  <span className="text-white font-bold text-lg md:text-xl">
                                    {cu.displayName.substring(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] md:text-[10px] text-center truncate w-[52px] md:w-[60px]">
                                {cu.displayName.split(" ")[0]}
                              </span>
                            </div>

                            {/* Other app icons */}
                            {[
                              {
                                name: "Messages",
                                gradient: "linear-gradient(180deg, #5AD539 0%, #28A908 100%)",
                                icon: "💬",
                              },
                              {
                                name: "Mail",
                                gradient: "linear-gradient(180deg, #1E90FF 0%, #147EFF 100%)",
                                icon: "✉️",
                              },
                              {
                                name: "Safari",
                                gradient: "linear-gradient(180deg, #4FACFE 0%, #00A4FF 100%)",
                                icon: "🧭",
                              },
                              {
                                name: "Photos",
                                gradient: "linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #8B5CF6 100%)",
                                icon: "🌈",
                              },
                              {
                                name: "Camera",
                                gradient: "linear-gradient(180deg, #6B7280 0%, #374151 100%)",
                                icon: "📷",
                              },
                              {
                                name: "Maps",
                                gradient: "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
                                icon: "🗺️",
                              },
                              {
                                name: "Clock",
                                gradient: "linear-gradient(180deg, #111827 0%, #000000 100%)",
                                icon: "🕐",
                              },
                              {
                                name: "Weather",
                                gradient: "linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)",
                                icon: "🌤️",
                              },
                              {
                                name: "Wallet",
                                gradient: "linear-gradient(180deg, #1F2937 0%, #111827 100%)",
                                icon: "💳",
                              },
                              {
                                name: "Settings",
                                gradient: "linear-gradient(180deg, #6B7280 0%, #4B5563 100%)",
                                icon: "⚙️",
                              },
                              {
                                name: "Notes",
                                gradient: "linear-gradient(180deg, #FDE047 0%, #FACC15 100%)",
                                icon: "📝",
                              },
                            ].map((app, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div
                                  className="w-[52px] md:w-[60px] h-[52px] md:h-[60px] rounded-[12px] md:rounded-[14px] flex items-center justify-center shadow-lg text-xl md:text-2xl"
                                  style={{ background: app.gradient }}
                                >
                                  {app.icon}
                                </div>
                                <span className="text-[9px] md:text-[10px] text-center truncate w-[52px] md:w-[60px]">
                                  {app.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dock */}
                        <div className="absolute bottom-4 left-3 right-3">
                          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-[20px] md:rounded-[22px] p-2 flex justify-around">
                            {[
                              { gradient: "linear-gradient(180deg, #5AD539 0%, #28A908 100%)", icon: "📞" },
                              { gradient: "linear-gradient(180deg, #5AD539 0%, #28A908 100%)", icon: "💬" },
                              { gradient: "linear-gradient(180deg, #1E90FF 0%, #147EFF 100%)", icon: "✉️" },
                              { gradient: "linear-gradient(180deg, #4FACFE 0%, #00A4FF 100%)", icon: "🧭" },
                            ].map((app, i) => (
                              <div
                                key={i}
                                className="w-[46px] md:w-[52px] h-[46px] md:h-[52px] rounded-[10px] md:rounded-[12px] flex items-center justify-center text-lg md:text-xl shadow-md"
                                style={{ background: app.gradient }}
                              >
                                {app.icon}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Home indicator */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 md:w-32 h-1 bg-black/20 dark:bg-white/20 rounded-full" />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Side buttons */}
              <div className="absolute -left-[2px] top-28 w-[3px] h-8 bg-slate-700 rounded-l" />
              <div className="absolute -left-[2px] top-44 w-[3px] h-16 bg-slate-700 rounded-l" />
              <div className="absolute -left-[2px] top-64 w-[3px] h-16 bg-slate-700 rounded-l" />
              <div className="absolute -right-[2px] top-40 w-[3px] h-20 bg-slate-700 rounded-r" />
            </div>
          </CardContent>
        </Card>

        {/* Logo Variants */}
        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Logo Assets (Auto-Generated)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Original */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Original</p>
                  <div className="w-16 md:w-20 h-16 md:h-20 border rounded-xl flex items-center justify-center bg-white p-2">
                    {!logoError ? (
                      <img
                        src={currentLogoUrl || "/placeholder.svg"}
                        alt="Original"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl"
                        style={{ backgroundColor: cu.primaryColor }}
                      >
                        {cu.displayName.substring(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Monochrome */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Monochrome</p>
                  <div className="w-16 md:w-20 h-16 md:h-20 border rounded-xl flex items-center justify-center bg-white p-2">
                    {!logoError ? (
                      <img
                        src={currentLogoUrl || "/placeholder.svg"}
                        alt="Monochrome"
                        className="max-w-full max-h-full object-contain"
                        style={monochromeStyle}
                      />
                    ) : (
                      <div className="w-full h-full rounded-lg flex items-center justify-center bg-black text-white font-bold text-lg md:text-xl">
                        {cu.displayName.substring(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* On brand - App Icon Style */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">App Icon</p>
                  <div
                    className="w-16 md:w-20 h-16 md:h-20 rounded-[16px] md:rounded-[18px] flex items-center justify-center shadow-lg p-2"
                    style={{ backgroundColor: cu.primaryColor }}
                  >
                    {!logoError ? (
                      <img
                        src={currentLogoUrl || "/placeholder.svg"}
                        alt="App icon"
                        className="max-w-full max-h-full object-contain"
                        style={whiteMonoStyle}
                      />
                    ) : (
                      <span className="text-white font-bold text-xl md:text-2xl">{cu.displayName.substring(0, 2)}</span>
                    )}
                  </div>
                </div>

                {/* Splash Logo */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Splash Logo</p>
                  <div
                    className="w-16 md:w-20 h-16 md:h-20 rounded-xl flex items-center justify-center p-1"
                    style={{ backgroundColor: cu.primaryColor }}
                  >
                    <div className="w-12 md:w-14 h-12 md:h-14 bg-white rounded-lg flex items-center justify-center p-1">
                      {!logoError ? (
                        <img
                          src={currentLogoUrl || "/placeholder.svg"}
                          alt="Splash"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="font-bold text-lg" style={{ color: cu.primaryColor }}>
                          {cu.displayName.substring(0, 2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Size variants */}
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                <p className="text-xs text-muted-foreground mb-3">Size Variants</p>
                <div className="flex items-end gap-3 md:gap-4 flex-wrap">
                  {[64, 48, 32, 24, 16].map((size) => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <div
                        className="border rounded-lg flex items-center justify-center bg-white overflow-hidden"
                        style={{ width: size, height: size, backgroundColor: cu.primaryColor }}
                      >
                        {!logoError ? (
                          <img
                            src={currentLogoUrl || "/placeholder.svg"}
                            alt={`${size}px`}
                            className="max-w-full max-h-full object-contain p-0.5"
                            style={whiteMonoStyle}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-bold"
                            style={{ fontSize: size / 3 }}
                          >
                            {cu.displayName.substring(0, 1)}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{size}px</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Banking Badge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Core Banking System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{
                    backgroundColor:
                      cu.coreBanking.provider === "Symitar"
                        ? "#00467F"
                        : cu.coreBanking.provider === "Fiserv"
                          ? "#FF6600"
                          : cu.primaryColor,
                  }}
                >
                  {cu.coreBanking.provider.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{cu.coreBanking.provider}</p>
                  <p className="text-sm text-muted-foreground truncate">{cu.coreBanking.platform}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {cu.coreBanking.confidence}% confidence
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">via {cu.coreBanking.source}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @keyframes splashIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
