"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Home, CreditCard, ArrowRightLeft, Receipt, MoreHorizontal,
  User, Shield, Bell, Settings, HelpCircle, Gift, LogOut,
  Smartphone, Fingerprint, ScanFace, KeyRound, MapPin,
  Building2, PiggyBank, Wallet, ChevronRight, CheckCircle2,
  AlertTriangle, Sparkles, Eye, Lock, Landmark
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface AppFlowArchitectureProps {
  cu: CreditUnionData
}

// Complete route structure matching the user's spec
const APP_ROUTES = {
  unauthenticated: {
    welcome: ["/welcome", "/welcome/sign-in", "/welcome/enroll"],
    onboarding: [
      "/enroll/start", "/enroll/registration", "/enroll/id-scan",
      "/enroll/verify-data", "/enroll/confirm-contact", "/enroll/password/create"
    ],
    mfa: ["/mfa/setup", "/mfa/faqs"],
    login: [
      "/login", "/login/member-number", "/login/password",
      "/login/recovery", "/login/method/biometric", "/login/method/selfie"
    ],
    device: [
      "/device/register", "/device/selfie/capture", "/device/link",
      "/device/token/place", "/device/complete"
    ]
  },
  authenticated: {
    overview: ["/home", "/home/quick-actions", "/home/search", "/home/notifications"],
    accounts: ["/accounts", "/accounts/savings/:id", "/accounts/checking/:id", "/accounts/loans/:id"],
    transactions: ["/transactions", "/transactions/:id"],
    move_money: [
      "/move-money", "/move-money/transfer", "/move-money/internal",
      "/move-money/external", "/move-money/pay-a-person", "/move-money/deposit-check"
    ],
    pay_bills: [
      "/pay-bills", "/pay-bills/billers", "/pay-bills/billers/add",
      "/pay-bills/payment/one-time", "/pay-bills/payment/recurring"
    ],
    profile: ["/profile", "/profile/beneficiaries", "/profile/estatements", "/profile/preferences"],
    security: ["/settings/security", "/settings/security/password", "/settings/security/biometric", "/settings/security/two-factor"],
    support: ["/support", "/support/help", "/support/contact", "/support/faqs"],
    offers: ["/offers", "/offers/featured", "/offers/rewards"]
  }
}

const FLOW_DOMAINS = [
  { id: "onboarding", name: "Onboarding", icon: Smartphone, color: "emerald", screens: 12 },
  { id: "auth", name: "Authentication", icon: Fingerprint, color: "blue", screens: 18 },
  { id: "home", name: "Home", icon: Home, color: "violet", screens: 8 },
  { id: "accounts", name: "Accounts", icon: Wallet, color: "amber", screens: 14 },
  { id: "move_money", name: "Move Money", icon: ArrowRightLeft, color: "cyan", screens: 22 },
  { id: "pay_bills", name: "Pay Bills", icon: Receipt, color: "orange", screens: 16 },
  { id: "profile", name: "Profile", icon: User, color: "pink", screens: 24 },
  { id: "security", name: "Security", icon: Shield, color: "red", screens: 18 },
  { id: "support", name: "Support", icon: HelpCircle, color: "slate", screens: 10 },
  { id: "offers", name: "Offers", icon: Gift, color: "yellow", screens: 12 },
]

const SCREEN_TEMPLATES = {
  onboarding: [
    { name: "Welcome", route: "/welcome", type: "entry" },
    { name: "ID Scan", route: "/enroll/id-scan", type: "capture" },
    { name: "Verify Data", route: "/enroll/verify-data", type: "form" },
    { name: "Set Password", route: "/enroll/password", type: "form" },
    { name: "MFA Setup", route: "/mfa/setup", type: "config" },
    { name: "Device Trust", route: "/device/register", type: "verify" },
  ],
  auth: [
    { name: "Login", route: "/login", type: "form" },
    { name: "Biometric", route: "/login/method/biometric", type: "verify" },
    { name: "Face ID", route: "/login/method/selfie", type: "capture" },
    { name: "Recovery", route: "/login/recovery", type: "form" },
  ],
  home: [
    { name: "Dashboard", route: "/home", type: "overview" },
    { name: "Quick Actions", route: "/home/quick-actions", type: "grid" },
    { name: "Notifications", route: "/home/notifications", type: "list" },
    { name: "Search", route: "/home/search", type: "search" },
  ],
  accounts: [
    { name: "All Accounts", route: "/accounts", type: "list" },
    { name: "Savings Detail", route: "/accounts/savings/:id", type: "detail" },
    { name: "Checking Detail", route: "/accounts/checking/:id", type: "detail" },
    { name: "Loan Detail", route: "/accounts/loans/:id", type: "detail" },
    { name: "Transactions", route: "/transactions", type: "list" },
  ],
  move_money: [
    { name: "Hub", route: "/move-money", type: "grid" },
    { name: "Transfer", route: "/move-money/transfer", type: "wizard" },
    { name: "Pay a Person", route: "/move-money/pay-a-person", type: "wizard" },
    { name: "Deposit Check", route: "/move-money/deposit-check", type: "capture" },
    { name: "Scheduled", route: "/move-money/scheduled", type: "list" },
  ],
  pay_bills: [
    { name: "Billers", route: "/pay-bills/billers", type: "list" },
    { name: "Add Biller", route: "/pay-bills/billers/add", type: "form" },
    { name: "One-Time", route: "/pay-bills/payment/one-time", type: "wizard" },
    { name: "Recurring", route: "/pay-bills/payment/recurring", type: "wizard" },
    { name: "History", route: "/pay-bills/history", type: "list" },
  ],
  profile: [
    { name: "Profile", route: "/profile", type: "detail" },
    { name: "Beneficiaries", route: "/profile/beneficiaries", type: "list" },
    { name: "eStatements", route: "/profile/estatements", type: "list" },
    { name: "Preferences", route: "/profile/preferences", type: "form" },
  ],
  security: [
    { name: "Security Hub", route: "/settings/security", type: "list" },
    { name: "Password", route: "/settings/security/password", type: "form" },
    { name: "Biometrics", route: "/settings/security/biometric", type: "config" },
    { name: "2FA", route: "/settings/security/two-factor", type: "config" },
    { name: "Devices", route: "/settings/security/trusted-devices", type: "list" },
  ],
  support: [
    { name: "Support", route: "/support", type: "grid" },
    { name: "Help Topics", route: "/support/help", type: "list" },
    { name: "FAQs", route: "/support/faqs", type: "list" },
    { name: "Contact", route: "/support/contact", type: "form" },
  ],
  offers: [
    { name: "Offers Hub", route: "/offers", type: "grid" },
    { name: "Featured", route: "/offers/featured", type: "list" },
    { name: "Rewards", route: "/offers/rewards", type: "detail" },
  ],
}

export function AppFlowArchitecture({ cu }: AppFlowArchitectureProps) {
  const [selectedDomain, setSelectedDomain] = useState("onboarding")
  const [hoveredScreen, setHoveredScreen] = useState<string | null>(null)

  const totalScreens = FLOW_DOMAINS.reduce((acc, d) => acc + d.screens, 0)
  const primaryColor = cu.primaryColor || "#1e3a5f"

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-white/10">
          <div className="text-3xl font-bold text-white">{totalScreens}</div>
          <div className="text-white/60 text-sm">Total Screens</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-white/10">
          <div className="text-3xl font-bold text-white">{FLOW_DOMAINS.length}</div>
          <div className="text-white/60 text-sm">Feature Domains</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-white/10">
          <div className="text-3xl font-bold text-emerald-400">100%</div>
          <div className="text-white/60 text-sm">Route Coverage</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-white/10">
          <div className="text-3xl font-bold text-amber-400">4</div>
          <div className="text-white/60 text-sm">Flow States</div>
        </Card>
      </div>

      {/* Domain Selector */}
      <div className="flex gap-2 flex-wrap">
        {FLOW_DOMAINS.map((domain) => {
          const Icon = domain.icon
          const isSelected = selectedDomain === domain.id
          return (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? "bg-white text-slate-900 shadow-lg"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {domain.name}
              <Badge variant="secondary" className={`text-xs ${isSelected ? "bg-slate-200" : "bg-white/10"}`}>
                {domain.screens}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Screen Flow Visualization */}
      <Card className="bg-slate-900/50 border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white capitalize">{selectedDomain.replace("_", " ")} Flow</h3>
            <p className="text-white/50 text-sm">Form → Review → Confirm → Error pattern</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400">Production Ready</Badge>
        </div>

        {/* Screen Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SCREEN_TEMPLATES[selectedDomain as keyof typeof SCREEN_TEMPLATES]?.map((screen, idx) => (
            <div
              key={screen.route}
              className="group relative"
              onMouseEnter={() => setHoveredScreen(screen.route)}
              onMouseLeave={() => setHoveredScreen(null)}
            >
              {/* Connection Line */}
              {idx < (SCREEN_TEMPLATES[selectedDomain as keyof typeof SCREEN_TEMPLATES]?.length || 0) - 1 && (
                <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-white/20 hidden lg:block" />
              )}

              {/* Screen Card */}
              <div className={`bg-slate-800/50 rounded-xl p-4 border transition-all cursor-pointer ${
                hoveredScreen === screen.route
                  ? "border-white/30 bg-slate-700/50 scale-105"
                  : "border-white/5 hover:border-white/20"
              }`}>
                {/* Mini Phone Frame */}
                <div className="w-full aspect-[9/16] bg-slate-950 rounded-lg mb-3 overflow-hidden relative">
                  {/* Status Bar */}
                  <div className="h-5 bg-slate-900 flex items-center justify-between px-2">
                    <span className="text-[8px] text-white/50">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-1.5 bg-white/30 rounded-sm" />
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                    </div>
                  </div>

                  {/* Screen Content Preview */}
                  <div className="p-2 space-y-1">
                    {screen.type === "form" && (
                      <>
                        <div className="h-2 w-12 bg-white/20 rounded" />
                        <div className="h-6 w-full bg-white/10 rounded mt-2" />
                        <div className="h-6 w-full bg-white/10 rounded" />
                        <div className="h-6 w-full rounded mt-2" style={{ backgroundColor: primaryColor }} />
                      </>
                    )}
                    {screen.type === "list" && (
                      <>
                        <div className="h-2 w-16 bg-white/20 rounded" />
                        {[1,2,3].map(i => (
                          <div key={i} className="h-8 w-full bg-white/5 rounded flex items-center gap-2 px-2 mt-1">
                            <div className="w-4 h-4 bg-white/10 rounded" />
                            <div className="flex-1">
                              <div className="h-1.5 w-12 bg-white/20 rounded" />
                              <div className="h-1 w-8 bg-white/10 rounded mt-1" />
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {screen.type === "grid" && (
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="aspect-square bg-white/5 rounded flex items-center justify-center">
                            <div className="w-4 h-4 bg-white/10 rounded" />
                          </div>
                        ))}
                      </div>
                    )}
                    {screen.type === "detail" && (
                      <>
                        <div className="h-12 w-full bg-white/5 rounded flex items-center justify-center">
                          <div className="text-center">
                            <div className="h-2 w-8 bg-white/30 rounded mx-auto" />
                            <div className="h-1 w-12 bg-white/10 rounded mx-auto mt-1" />
                          </div>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded mt-1" />
                        <div className="h-4 w-full bg-white/5 rounded" />
                      </>
                    )}
                    {screen.type === "wizard" && (
                      <>
                        <div className="flex gap-1 mb-2">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`flex-1 h-1 rounded ${i === 1 ? "bg-white/40" : "bg-white/10"}`} />
                          ))}
                        </div>
                        <div className="h-2 w-16 bg-white/20 rounded" />
                        <div className="h-8 w-full bg-white/10 rounded mt-2" />
                      </>
                    )}
                    {(screen.type === "capture" || screen.type === "verify") && (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-12 h-12 border-2 border-white/20 rounded-full flex items-center justify-center">
                          {screen.type === "capture" ? (
                            <ScanFace className="w-6 h-6 text-white/30" />
                          ) : (
                            <Fingerprint className="w-6 h-6 text-white/30" />
                          )}
                        </div>
                      </div>
                    )}
                    {screen.type === "overview" && (
                      <>
                        <div className="h-8 w-full rounded" style={{ backgroundColor: primaryColor + "40" }}>
                          <div className="p-1">
                            <div className="h-1 w-8 bg-white/30 rounded" />
                            <div className="h-2 w-12 bg-white/50 rounded mt-1" />
                          </div>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="flex-1 h-6 bg-white/5 rounded" />
                          ))}
                        </div>
                      </>
                    )}
                    {screen.type === "entry" && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 rounded-xl mb-2" style={{ backgroundColor: primaryColor }} />
                        <div className="h-1.5 w-12 bg-white/20 rounded" />
                        <div className="h-4 w-full rounded mt-4" style={{ backgroundColor: primaryColor }} />
                        <div className="h-4 w-full bg-white/10 rounded mt-1" />
                      </div>
                    )}
                    {screen.type === "config" && (
                      <>
                        <div className="h-2 w-16 bg-white/20 rounded" />
                        {[1,2,3].map(i => (
                          <div key={i} className="flex items-center justify-between mt-2">
                            <div className="h-1.5 w-12 bg-white/10 rounded" />
                            <div className="w-6 h-3 bg-white/20 rounded-full" />
                          </div>
                        ))}
                      </>
                    )}
                    {screen.type === "search" && (
                      <>
                        <div className="h-6 w-full bg-white/10 rounded flex items-center px-2">
                          <div className="w-3 h-3 bg-white/20 rounded" />
                        </div>
                        <div className="h-1.5 w-12 bg-white/10 rounded mt-2" />
                        <div className="h-4 w-full bg-white/5 rounded mt-1" />
                        <div className="h-4 w-full bg-white/5 rounded" />
                      </>
                    )}
                  </div>

                  {/* Bottom Nav */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-900 flex items-center justify-around px-2">
                    {[Home, Wallet, ArrowRightLeft, Receipt, MoreHorizontal].map((Icon, i) => (
                      <Icon key={i} className="w-3 h-3 text-white/30" />
                    ))}
                  </div>
                </div>

                <p className="text-white font-medium text-sm truncate">{screen.name}</p>
                <p className="text-white/40 text-xs truncate">{screen.route}</p>
                <Badge variant="outline" className="mt-2 text-[10px] bg-white/5 border-white/10 text-white/60">
                  {screen.type}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Flow Pattern Legend */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-white/40 text-xs mb-3">Universal Flow Pattern</p>
          <div className="flex items-center gap-3 text-sm">
            {["Form", "Review", "Confirm", "Error"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                  i === 3 ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"
                }`}>
                  {i + 1}
                </div>
                <span className="text-white/60">{step}</span>
                {i < 3 && <ChevronRight className="w-4 h-4 text-white/20" />}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Bottom Nav Preview */}
      <Card className="bg-slate-900/50 border-white/10 p-4">
        <p className="text-white/40 text-xs mb-3">Global Navigation Shell</p>
        <div className="flex items-center justify-around py-3 bg-white rounded-xl">
          {[
            { icon: Home, label: "Home", active: true },
            { icon: Wallet, label: "Accounts" },
            { icon: ArrowRightLeft, label: "Move Money" },
            { icon: Receipt, label: "Pay Bills" },
            { icon: MoreHorizontal, label: "More" },
          ].map((nav) => (
            <div key={nav.label} className="flex flex-col items-center gap-1">
              <nav.icon className={`w-5 h-5 ${nav.active ? "" : "text-slate-400"}`} style={{ color: nav.active ? primaryColor : undefined }} />
              <span className={`text-xs ${nav.active ? "font-medium" : "text-slate-400"}`} style={{ color: nav.active ? primaryColor : undefined }}>
                {nav.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
