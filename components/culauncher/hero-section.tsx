"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function HeroSection() {
  const [cuCount, setCuCount] = useState(0)
  const targetCount = 4822

  useEffect(() => {
    // Animate counter
    const duration = 2000
    const steps = 60
    const increment = targetCount / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetCount) {
        setCuCount(targetCount)
        clearInterval(timer)
      } else {
        setCuCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="max-w-6xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            We've Configured All{" "}
            <span className="text-white border-b-4 border-white">
              {cuCount.toLocaleString()}
            </span>{" "}
            NCUA Credit Unions
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-light">
            We Have Yours.
          </p>
        </div>

        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
          Complete digital transformation platform. One canonical API. Every core system. Ready to launch.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 rounded-none border-2 border-white"
          >
            Join the Pilot Program
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-black text-lg px-8 py-6 rounded-none"
          >
            See Your Configuration
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-8 pt-12 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <span>NCUA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <span>ISO 20022</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
            <span>FDX 1033 Ready</span>
          </div>
        </div>
      </div>
    </section>
  )
}
