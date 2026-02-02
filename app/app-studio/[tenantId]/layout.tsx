import { Metadata } from "next"

export const metadata: Metadata = {
  title: "App Builder Studio",
  description: "Build and preview mobile apps in real-time",
}

export default function AppStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Minimal layout - no sidebar, header, or other navigation
  // This allows the page to be embedded as an iframe in external portals
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
