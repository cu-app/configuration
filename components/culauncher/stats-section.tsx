"use client"

import { Database, Code, Network, CreditCard, Shield, CheckCircle2 } from "lucide-react"

const stats = [
  {
    icon: Database,
    label: "Credit Unions",
    value: "4,822",
    description: "All NCUA federally insured credit unions pre-configured",
  },
  {
    icon: Code,
    label: "PowerOn Specs",
    value: "139",
    description: "Ready-to-use Symitar PowerOn specifications",
  },
  {
    icon: Network,
    label: "Core Adapters",
    value: "6",
    description: "Symitar, DNA, Jack Henry, Corelation, Fiserv, Temenos",
  },
  {
    icon: CreditCard,
    label: "Payment Rails",
    value: "5",
    description: "ACH, RTP, FedNow, Wire, Card networks",
  },
  {
    icon: Shield,
    label: "Compliance",
    value: "100%",
    description: "FDX 1033, ISO 20022, audit logging built-in",
  },
  {
    icon: CheckCircle2,
    label: "Configuration Keys",
    value: "380+",
    description: "Per-credit-union customization options",
  },
]

export function StatsSection() {
  return (
    <section className="py-24 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything is Pre-Configured
          </h2>
          <p className="text-xl text-gray-400">
            We've done the hard work. You launch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="border-2 border-white p-8 bg-black hover:bg-gray-900 transition-colors"
              >
                <Icon className="h-12 w-12 mb-4 text-white" />
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-xl font-semibold mb-2">{stat.label}</div>
                <div className="text-gray-400 text-sm">{stat.description}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
