"use client"

import { HeroSection } from "@/components/culauncher/hero-section"
import { ArchitectureSection } from "@/components/culauncher/architecture-section"
import { StatsSection } from "@/components/culauncher/stats-section"
import { PilotProgramSection } from "@/components/culauncher/pilot-program-section"
import { CapabilitiesSection } from "@/components/culauncher/capabilities-section"
import { CTASection } from "@/components/culauncher/cta-section"
import { CUSearchSection } from "@/components/culauncher/cu-search-section"

export default function CULauncherPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <HeroSection />
      <CUSearchSection />
      <StatsSection />
      <ArchitectureSection />
      <CapabilitiesSection />
      <PilotProgramSection />
      <CTASection />
    </div>
  )
}
