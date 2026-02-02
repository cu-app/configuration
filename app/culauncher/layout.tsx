import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CU Launcher | Digital Transformation for Credit Unions",
  description:
    "We've configured all 4,822 NCUA credit unions. Complete digital transformation platform. One canonical API. Every core system. Ready to launch.",
}

export default function CULauncherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
