"use client"

import { useState, useEffect } from "react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import type { CreditUnionConfig } from "@/types/cu-config"
import { DEFAULT_CU_CONFIG } from "@/lib/cu-config-defaults"
import { cn } from "@/lib/utils"

interface FlutterAppPreviewProps {
  cu: CreditUnionData
  config?: CreditUnionConfig
}

export function FlutterAppPreview({ cu, config }: FlutterAppPreviewProps) {
  const c = config || DEFAULT_CU_CONFIG
  const [screen, setScreen] = useState<"splash" | "login" | "home">("splash")
  const [showBalance, setShowBalance] = useState(true)
  const [splashPhase, setSplashPhase] = useState(0)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [logoError, setLogoError] = useState(false)

  const primaryColor = cu.primaryColor || "#1a56db"

  // Logo URL with proper fallback chain for Supabase data
  const logoChain = [
    cu.logoUrls?.direct,
    cu.logoUrl,
    cu.logoUrls?.brandfetch,
    cu.logoUrls?.clearbit,
    cu.logoUrls?.google,
    cu.website ? `https://www.google.com/s2/favicons?domain=${cu.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}&sz=128` : null,
  ].filter(Boolean) as string[]

  const [logoUrlIndex, setLogoUrlIndex] = useState(0)
  const logoUrl = logoChain[logoUrlIndex] || null

  // Handle logo error by trying next in chain
  const handleLogoError = () => {
    if (logoUrlIndex < logoChain.length - 1) {
      setLogoUrlIndex(prev => prev + 1)
      setLogoError(false)
    } else {
      setLogoError(true)
    }
  }

  // Splash screen animation phases
  useEffect(() => {
    if (screen === "splash") {
      setSplashPhase(0)
      setLogoLoaded(false)

      const t1 = setTimeout(() => setSplashPhase(1), 300)
      const t2 = setTimeout(() => setSplashPhase(2), 800)
      const t3 = setTimeout(() => setSplashPhase(3), 1500)
      const t4 = setTimeout(() => {
        setScreen("login")
      }, 2800)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
  }, [screen])

  // Reset on CU change
  useEffect(() => {
    setScreen("splash")
    setLogoError(false)
    setLogoUrlIndex(0)
  }, [cu.id])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(n))

  // Material Design elevation shadow
  const elevation = (level: number) => {
    const shadows: Record<number, string> = {
      0: "none",
      1: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
      2: "0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)",
      3: "0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)",
      4: "0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)",
      6: "0 20px 40px rgba(0,0,0,0.2)",
    }
    return shadows[level] || shadows[2]
  }

  // Render tenant logo with fallback to initials
  const renderLogo = (size: number, white = false) => {
    if (logoError || !logoUrl) {
      return (
        <div
          className="flex items-center justify-center font-bold rounded-xl"
          style={{
            width: size,
            height: size,
            backgroundColor: white ? "rgba(255,255,255,0.2)" : primaryColor,
            color: white ? "white" : "white",
            fontSize: size * 0.35,
          }}
        >
          {cu.displayName.substring(0, 2).toUpperCase()}
        </div>
      )
    }

    return (
      <img
        src={logoUrl || "/placeholder.svg"}
        alt={cu.displayName}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: white ? "brightness(0) invert(1)" : "none",
        }}
        onLoad={() => setLogoLoaded(true)}
        onError={handleLogoError}
      />
    )
  }

  // SPLASH SCREEN - White background with tenant logo
  const renderSplash = () => (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center overflow-hidden">
      {/* Logo container with brand color */}
      <div
        className={cn(
          "rounded-3xl flex items-center justify-center transition-all duration-700 ease-out",
          splashPhase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75",
        )}
        style={{
          width: 120,
          height: 120,
          backgroundColor: primaryColor,
          boxShadow: elevation(4),
        }}
      >
        <div className="bg-white rounded-2xl flex items-center justify-center p-3" style={{ width: 88, height: 88 }}>
          {renderLogo(64)}
        </div>
      </div>

      {/* Credit Union name */}
      <h1
        className={cn(
          "mt-6 text-xl font-semibold text-center px-8 transition-all duration-500 delay-200",
          splashPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
        style={{ color: primaryColor, fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {cu.displayName}
      </h1>

      <p
        className={cn(
          "mt-1 text-sm text-gray-500 transition-all duration-500 delay-300",
          splashPhase >= 2 ? "opacity-100" : "opacity-0",
        )}
      >
        Mobile Banking
      </p>

      {/* Material loading indicator */}
      <div
        className={cn("mt-10 transition-all duration-500 delay-500", splashPhase >= 3 ? "opacity-100" : "opacity-0")}
      >
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeDasharray="75"
            strokeDashoffset="25"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Powered by footer */}
      <p className="absolute bottom-6 text-xs text-gray-400">Powered by CU.APP</p>
    </div>
  )

  // LOGIN SCREEN
  const renderLogin = () => (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div
        className="pt-14 pb-8 flex flex-col items-center"
        style={{
          background: `linear-gradient(180deg, ${primaryColor}12 0%, transparent 100%)`,
        }}
      >
        <div
          className="rounded-2xl flex items-center justify-center mb-4"
          style={{
            width: 72,
            height: 72,
            backgroundColor: primaryColor,
            boxShadow: elevation(3),
          }}
        >
          {renderLogo(48, true)}
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{cu.displayName}</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        {/* Username field */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-2 block">Username</label>
          <div
            className="h-14 rounded-xl bg-gray-50 border border-gray-200 px-4 flex items-center"
            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-gray-400 text-sm">Enter username</span>
          </div>
        </div>

        {/* Password field */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-600 mb-2 block">Password</label>
          <div
            className="h-14 rounded-xl bg-gray-50 border border-gray-200 px-4 flex items-center"
            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}
          >
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-gray-400 text-sm flex-1">Enter password</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
        </div>

        {/* Sign in button - Material elevated button */}
        <button
          className="w-full h-14 rounded-xl text-white font-semibold text-base transition-all active:scale-[0.98]"
          style={{
            backgroundColor: primaryColor,
            boxShadow: elevation(2),
          }}
          onClick={() => setScreen("home")}
        >
          Sign In
        </button>

        {/* Biometrics */}
        <div className="flex justify-center mt-8">
          <button className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: primaryColor }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Use Face ID</span>
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          Forgot password?{" "}
          <span className="font-medium" style={{ color: primaryColor }}>
            Reset
          </span>
        </p>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-sm text-gray-500">
          New member?{" "}
          <span className="font-medium" style={{ color: primaryColor }}>
            Enroll Now
          </span>
        </p>
      </div>
    </div>
  )

  // HOME SCREEN
  const renderHome = () => {
    const accounts = [
      { name: "Primary Savings", number: "****1234", balance: 12456.78 },
      { name: "Checking", number: "****5678", balance: 3892.45 },
    ]
    const total = accounts.reduce((s, a) => s + a.balance, 0)

    return (
      <div className="absolute inset-0 bg-gray-100 flex flex-col">
        {/* App bar */}
        <div className="pt-12 pb-5 px-5" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {renderLogo(28, true)}
              </div>
              <div>
                <p className="text-white/70 text-xs">Good morning</p>
                <p className="text-white font-semibold">John Smith</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                  2
                </span>
              </div>
            </div>
          </div>

          {/* Balance card */}
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-xs">Total Balance</span>
              <button onClick={() => setShowBalance(!showBalance)}>
                <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showBalance ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  )}
                </svg>
              </button>
            </div>
            <p className="text-white text-3xl font-bold">{showBalance ? formatCurrency(total) : "••••••"}</p>

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 h-10 bg-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{ color: primaryColor }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Transfer
              </button>
              <button className="flex-1 h-10 bg-white/20 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Pay Bills
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-5 py-4 pb-24">
          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {["Transfer", "Cards", "ATMs", "Help"].map((label, i) => (
              <button key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}12` }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: primaryColor }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {i === 0 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    )}
                    {i === 1 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    )}
                    {i === 2 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    )}
                    {i === 3 && (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                </div>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Accounts */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">My Accounts</h3>
              <span className="text-xs" style={{ color: primaryColor }}>
                See All
              </span>
            </div>
            <div className="space-y-2">
              {accounts.map((acc, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 flex items-center" style={{ boxShadow: elevation(1) }}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${primaryColor}12` }}
                  >
                    <svg
                      className="w-6 h-6"
                      style={{ color: primaryColor }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{acc.name}</p>
                    <p className="text-xs text-gray-400">{acc.number}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{showBalance ? formatCurrency(acc.balance) : "••••"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              <span className="text-xs" style={{ color: primaryColor }}>
                See All
              </span>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: elevation(1) }}>
              {[
                { name: "Direct Deposit", amount: 2450, date: "Today" },
                { name: "Amazon", amount: -67.89, date: "Yesterday" },
                { name: "Starbucks", amount: -8.45, date: "Yesterday" },
              ].map((tx, i, arr) => (
                <div key={i} className={cn("p-4 flex items-center", i < arr.length - 1 && "border-b border-gray-100")}>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mr-3",
                      tx.amount > 0 ? "bg-green-100" : "bg-gray-100",
                    )}
                  >
                    <svg
                      className={cn("w-5 h-5", tx.amount > 0 ? "text-green-600" : "text-gray-500")}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {tx.amount > 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{tx.name}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                  <p className={cn("font-semibold text-sm", tx.amount > 0 ? "text-green-600" : "text-gray-900")}>
                    {tx.amount > 0 ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom navigation - Material Design 3 */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-white px-2 pt-2 pb-7"
          style={{ boxShadow: "0 -1px 0 rgba(0,0,0,0.05)" }}
        >
          <div className="flex justify-around">
            {[
              {
                icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                label: "Home",
                active: true,
              },
              {
                icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
                label: "Accounts",
                active: false,
              },
              { icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", label: "Transfer", active: false },
              {
                icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
                label: "Alerts",
                active: false,
              },
              {
                icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                label: "Profile",
                active: false,
              },
            ].map((item, i) => (
              <button key={i} className="flex flex-col items-center gap-1 py-1 px-3">
                <svg
                  className="w-6 h-6"
                  style={{ color: item.active ? primaryColor : "#9ca3af" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span
                  className="text-[10px]"
                  style={{ color: item.active ? primaryColor : "#9ca3af", fontWeight: item.active ? 600 : 400 }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {screen === "splash" && renderSplash()}
      {screen === "login" && renderLogin()}
      {screen === "home" && renderHome()}
    </div>
  )
}
