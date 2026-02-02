"use client"

import { useState } from "react"
import { Layers, Network, Code, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const layers = [
  {
    id: "layer0",
    name: "Adapter Mesh",
    description: "System Integration",
    adapters: [
      "Symitar Adapter",
      "Fiserv DNA Adapter",
      "Jack Henry Adapter",
      "CO-OP LOS Adapter",
      "Marlin/Calyx LOS Adapter",
      "Card Processor Adapter",
      "External API Adapters",
    ],
    color: "bg-black text-white",
  },
  {
    id: "layer1",
    name: "Canonical API Gateway",
    description: "Single contract for all UX & partners",
    endpoints: [
      "/members/{id}",
      "/accounts/{id}",
      "/loans/{id}",
      "/payments",
      "/consents",
      "/compliance",
    ],
    color: "bg-white text-black border-2 border-black",
  },
  {
    id: "layer2",
    name: "Capability Services",
    description: "Business Logic Layer",
    services: [
      "Member Service",
      "Account Service",
      "Lending Service",
      "Payments Service",
      "Open Banking Service",
      "Compliance Service",
    ],
    color: "bg-black text-white",
  },
  {
    id: "layer3",
    name: "Experience Layer",
    description: "UI/SDK/Partners",
    experiences: [
      "Web/Mobile (Member-facing)",
      "Backoffice (Staff-facing)",
      "Third-Party Partner APIs",
    ],
    color: "bg-white text-black border-2 border-black",
  },
]

export function ArchitectureSection() {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            One API, Every Core
          </h2>
          <p className="text-xl text-gray-600">
            Adapter-driven architecture that works with your existing core system
          </p>
        </div>

        <div className="space-y-4">
          {layers.map((layer, index) => {
            const isExpanded = expandedLayer === layer.id
            return (
              <Card
                key={layer.id}
                className={`${layer.color} rounded-none border-2 border-black cursor-pointer transition-all`}
                onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">Layer {index}</div>
                      <div>
                        <div className="text-xl font-bold">{layer.name}</div>
                        <div className="text-sm opacity-80">{layer.description}</div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-6 w-6" />
                    ) : (
                      <ChevronDown className="h-6 w-6" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t-2 border-current opacity-50">
                      {layer.adapters && (
                        <div>
                          <div className="font-semibold mb-2">Adapters:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {layer.adapters.map((adapter, i) => (
                              <li key={i}>{adapter}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {layer.endpoints && (
                        <div>
                          <div className="font-semibold mb-2">Endpoints:</div>
                          <ul className="list-disc list-inside space-y-1 font-mono text-sm">
                            {layer.endpoints.map((endpoint, i) => (
                              <li key={i}>{endpoint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {layer.services && (
                        <div>
                          <div className="font-semibold mb-2">Services:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {layer.services.map((service, i) => (
                              <li key={i}>{service}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {layer.experiences && (
                        <div>
                          <div className="font-semibold mb-2">Experiences:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {layer.experiences.map((exp, i) => (
                              <li key={i}>{exp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p className="text-lg">
            <strong>Core Principle:</strong> One canonical API surface backed by adapter-driven core integration.
          </p>
        </div>
      </div>
    </section>
  )
}
