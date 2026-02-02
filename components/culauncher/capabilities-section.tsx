"use client"

import { Users, Wallet, CreditCard, DollarSign, Shield, Network } from "lucide-react"

const capabilities = [
  {
    icon: Users,
    title: "Party & Identity",
    items: ["Member", "Account Holder", "Beneficiary & Authorized User", "KYC/KYT metadata"],
  },
  {
    icon: Wallet,
    title: "Accounts & Deposits",
    items: [
      "Share Account",
      "Draft Account",
      "Savings Account",
      "Money Market",
      "CD",
      "Account Balance & Ledger",
    ],
  },
  {
    icon: CreditCard,
    title: "Lending",
    items: [
      "Loan Application",
      "Loan Origination",
      "Collateral",
      "Payment Schedule",
      "Collections",
    ],
  },
  {
    icon: DollarSign,
    title: "Payments & Settlement",
    items: [
      "Payment Order (ACH, Wire, Instant, Card)",
      "Payment Rail Route",
      "Transaction",
      "Fee & Interest Accrual",
    ],
  },
  {
    icon: Network,
    title: "Open Banking",
    items: ["Consent & Authorization", "API Client", "Data Grant"],
  },
  {
    icon: Shield,
    title: "Compliance & Governance",
    items: ["Audit Log", "Risk Event", "Regulatory Report", "System Configuration"],
  },
]

export function CapabilitiesSection() {
  return (
    <section className="py-24 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            ISO 20022-Based Domain Model
          </h2>
          <p className="text-xl text-gray-400">
            Complete financial services domain coverage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon
            return (
              <div
                key={index}
                className="border-2 border-white p-6 bg-black hover:bg-gray-900 transition-colors"
              >
                <Icon className="h-10 w-10 mb-4 text-white" />
                <h3 className="text-xl font-bold mb-4">{cap.title}</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  {cap.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-white mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
