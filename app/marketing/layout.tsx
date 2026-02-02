// MARKETING CMS LAYOUT
// Separate layout for marketing team with products, content, and website CMS access

export const dynamic = 'force-dynamic'

import type React from "react"
import { Toaster } from "sonner"

export const metadata = {
  title: "Marketing CMS | CU.APP",
  description: "Marketing content management system for credit union products and website",
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster position="bottom-right" />
    </div>
  )
}
