"use client"

import { useState, useEffect } from "react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { cn } from "@/lib/utils"

interface IPhoneDeviceFrameProps {
  cu: CreditUnionData
  showSplash?: boolean
  className?: string
}

export function IPhoneDeviceFrame({ cu, showSplash = false, className }: IPhoneDeviceFrameProps) {
  const [logoError, setLogoError] = useState(false)
  const [currentLogoUrl, setCurrentLogoUrl] = useState("")
  const [splashAnimating, setSplashAnimating] = useState(false)
  const [showingApp, setShowingApp] = useState(!showSplash)

  useEffect(() => {
    setLogoError(false)
    setCurrentLogoUrl(cu.logoUrls?.direct || cu.logoUrls?.brandfetch || cu.logoUrls?.clearbit || "")
  }, [cu])

  useEffect(() => {
    if (showSplash) {
      setSplashAnimating(true)
      setShowingApp(false)
      const timer = setTimeout(() => {
        setSplashAnimating(false)
        setShowingApp(true)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [showSplash, cu.id])

  function handleLogoError() {
    if (currentLogoUrl === cu.logoUrls?.direct && cu.logoUrls?.brandfetch) {
      setCurrentLogoUrl(cu.logoUrls.brandfetch)
    } else if (currentLogoUrl === cu.logoUrls?.brandfetch && cu.logoUrls?.clearbit) {
      setCurrentLogoUrl(cu.logoUrls.clearbit)
    } else if (currentLogoUrl === cu.logoUrls?.clearbit && cu.logoUrls?.google) {
      setCurrentLogoUrl(cu.logoUrls.google)
    } else {
      setLogoError(true)
    }
  }

  const LogoDisplay = ({ size = "lg", inverted = false }: { size?: "sm" | "md" | "lg"; inverted?: boolean }) => {
    const sizeClasses = { sm: "w-8 h-8", md: "w-16 h-16", lg: "w-24 h-24" }

    if (logoError || !currentLogoUrl) {
      return (
        <div
          className={cn("rounded-2xl flex items-center justify-center font-bold", sizeClasses[size])}
          style={{
            backgroundColor: inverted ? "white" : cu.primaryColor,
            color: inverted ? cu.primaryColor : "white",
          }}
        >
          <span className={size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-sm"}>
            {cu.displayName.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )
    }

    return (
      <img
        src={currentLogoUrl || "/placeholder.svg"}
        alt={cu.displayName}
        className={cn("object-contain", sizeClasses[size])}
        onError={handleLogoError}
      />
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* iPhone 15 Pro Frame - Titanium finish */}
      <div
        className="w-[280px] h-[572px] rounded-[52px] p-[2px] shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #a1a1a1 0%, #7a7a7a 50%, #5c5c5c 100%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {/* Inner bezel */}
        <div className="w-full h-full bg-black rounded-[50px] p-[10px]">
          {/* Screen */}
          <div
            className={cn(
              "w-full h-full rounded-[42px] overflow-hidden relative transition-all duration-700",
              showingApp ? "bg-white" : "",
            )}
            style={{
              backgroundColor: !showingApp ? "white" : undefined,
            }}
          >
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[100px] h-[32px] bg-black rounded-full flex items-center justify-center gap-3 z-30">
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
              <div className="w-3 h-3 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
            </div>

            {/* Splash Screen - WHITE BACKGROUND with tenant logo */}
            {!showingApp && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                {/* Logo Container */}
                <div
                  className={cn(
                    "w-32 h-32 rounded-3xl flex items-center justify-center p-4 shadow-lg",
                    splashAnimating && "animate-pulse",
                  )}
                  style={{ backgroundColor: cu.primaryColor }}
                >
                  <LogoDisplay size="lg" inverted />
                </div>

                {/* CU Name */}
                <h1 className="text-2xl font-bold mt-6 text-center" style={{ color: cu.primaryColor }}>
                  {cu.displayName}
                </h1>
                <p className="text-gray-500 text-sm mt-1">Mobile Banking</p>

                {/* Material Design Loading Indicator */}
                <div className="mt-8">
                  <div
                    className="w-8 h-8 border-3 border-gray-200 rounded-full animate-spin"
                    style={{ borderTopColor: cu.primaryColor }}
                  />
                </div>

                {/* Powered By */}
                <p className="absolute bottom-8 text-gray-400 text-xs">Powered by CU.APP</p>
              </div>
            )}

            {/* Material Design App UI */}
            {showingApp && (
              <div className="h-full flex flex-col bg-gray-50">
                {/* Status Bar */}
                <div className="h-14 flex items-end justify-between px-6 pb-1 pt-8">
                  <span className="text-xs font-semibold text-gray-900">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={cn("w-1 rounded-full bg-gray-900", i <= 3 ? "h-2" : "h-3")} />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium ml-1">5G</span>
                    <div className="w-6 h-3 border border-gray-900 rounded-sm ml-1 relative">
                      <div className="absolute inset-0.5 bg-gray-900 rounded-sm" style={{ width: "80%" }} />
                    </div>
                  </div>
                </div>

                {/* App Bar - Material Design */}
                <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: cu.primaryColor }}>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    <LogoDisplay size="sm" inverted />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Welcome back</p>
                    <p className="text-white/70 text-xs">John Smith</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                </div>

                {/* Balance Card - Material Design Elevation */}
                <div className="px-4 -mt-2">
                  <div
                    className="rounded-2xl p-4 text-white shadow-lg"
                    style={{
                      backgroundColor: cu.primaryColor,
                      boxShadow: `0 4px 20px ${cu.primaryColor}40`,
                    }}
                  >
                    <p className="text-white/70 text-xs uppercase tracking-wider">Total Balance</p>
                    <p className="text-3xl font-bold mt-1">$24,562.80</p>
                    <div className="flex gap-4 mt-4">
                      <div className="flex-1">
                        <p className="text-white/60 text-[10px]">Checking</p>
                        <p className="text-sm font-medium">$12,450.00</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-[10px]">Savings</p>
                        <p className="text-sm font-medium">$12,112.80</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Material Design FAB style */}
                <div className="px-4 py-4">
                  <div className="flex justify-around">
                    {[
                      { icon: "↗", label: "Transfer" },
                      { icon: "📱", label: "Pay" },
                      { icon: "📄", label: "Deposit" },
                      { icon: "⋯", label: "More" },
                    ].map((action) => (
                      <div key={action.label} className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-md"
                          style={{ backgroundColor: `${cu.primaryColor}15` }}
                        >
                          <span style={{ color: cu.primaryColor }}>{action.icon}</span>
                        </div>
                        <span className="text-[10px] text-gray-600">{action.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions - Material Design List */}
                <div className="flex-1 bg-white rounded-t-3xl px-4 pt-4 shadow-inner">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</p>
                  <div className="space-y-3">
                    {[
                      { name: "Amazon", amount: "-$156.32", icon: "🛒" },
                      { name: "Salary Deposit", amount: "+$3,200.00", icon: "💰", positive: true },
                      { name: "Starbucks", amount: "-$6.45", icon: "☕" },
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {tx.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{tx.name}</p>
                          <p className="text-xs text-gray-500">Today</p>
                        </div>
                        <p className={cn("text-sm font-semibold", tx.positive ? "text-green-600" : "text-gray-900")}>
                          {tx.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Navigation - Material Design */}
                <div className="h-16 bg-white border-t flex items-center justify-around px-2">
                  {[
                    { icon: "🏠", label: "Home", active: true },
                    { icon: "💳", label: "Cards" },
                    { icon: "📊", label: "Insights" },
                    { icon: "⚙️", label: "Settings" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg",
                        item.active && "bg-gray-100",
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span
                        className={cn("text-[9px]", item.active ? "font-medium" : "text-gray-500")}
                        style={{ color: item.active ? cu.primaryColor : undefined }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Home Indicator */}
                <div className="h-6 flex items-center justify-center bg-white">
                  <div className="w-32 h-1 bg-gray-300 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side Buttons */}
      <div className="absolute -left-[2px] top-28 w-[3px] h-8 bg-zinc-600 rounded-l" />
      <div className="absolute -left-[2px] top-44 w-[3px] h-14 bg-zinc-600 rounded-l" />
      <div className="absolute -left-[2px] top-[248px] w-[3px] h-14 bg-zinc-600 rounded-l" />
      <div className="absolute -right-[2px] top-44 w-[3px] h-20 bg-zinc-600 rounded-r" />
    </div>
  )
}
