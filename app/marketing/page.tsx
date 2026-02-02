// MARKETING CMS DASHBOARD
// Main entry point for marketing team

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Package,
  FileText,
  Globe,
  ImageIcon,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  Palette,
} from "lucide-react"
import { CULogo } from "@/components/shared/cu-logo"
import { ProductCatalogEditor } from "@/components/marketing/product-catalog-editor"
import { ContentEditor } from "@/components/marketing/content-editor"
import { WebsiteEditor } from "@/components/marketing/website-editor"
import { TOP_20_CREDIT_UNIONS, type CreditUnionData } from "@/lib/credit-union-data"

const NAV_ITEMS = [
  { id: "products", name: "Products", icon: <Package className="h-4 w-4" />, description: "Manage product catalog" },
  {
    id: "content",
    name: "Content & Copy",
    icon: <FileText className="h-4 w-4" />,
    description: "Marketing copy and messaging",
  },
  { id: "website", name: "Website CMS", icon: <Globe className="h-4 w-4" />, description: "Edit website pages" },
  { id: "media", name: "Media Library", icon: <ImageIcon className="h-4 w-4" />, description: "Images and assets" },
  { id: "analytics", name: "Analytics", icon: <BarChart3 className="h-4 w-4" />, description: "Performance metrics" },
]

const STATS = [
  { label: "Products", value: "24", change: "+3", icon: <Package className="h-4 w-4" /> },
  { label: "Pages", value: "12", change: "+1", icon: <FileText className="h-4 w-4" /> },
  { label: "Visitors (7d)", value: "8.2K", change: "+12%", icon: <Users className="h-4 w-4" /> },
  { label: "Conversions", value: "342", change: "+8%", icon: <TrendingUp className="h-4 w-4" /> },
]

export default function MarketingDashboard() {
  const [activeNav, setActiveNav] = useState("products")
  const [dark, setDark] = useState(false)
  const [selectedCU, setSelectedCU] = useState<CreditUnionData>(TOP_20_CREDIT_UNIONS[0])
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [dark])

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Palette className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">Marketing CMS</p>
              <p className="text-xs text-muted-foreground">CU.APP</p>
            </div>
          </div>
        </div>

        {/* CU Selector */}
        <div className="p-3 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2 bg-transparent">
                <CULogo cu={selectedCU} size="sm" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{selectedCU.displayName}</p>
                  <p className="text-xs text-muted-foreground">#{selectedCU.charter}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Select Credit Union</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TOP_20_CREDIT_UNIONS.slice(0, 10).map((cu) => (
                <DropdownMenuItem key={cu.id} onClick={() => setSelectedCU(cu)} className="gap-2">
                  <CULogo cu={cu} size="xs" />
                  <span className="truncate">{cu.displayName}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant={activeNav === item.id ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start gap-2 h-9"
              onClick={() => setActiveNav(item.id)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{dark ? "Light Mode" : "Dark Mode"}</span>
          </Button>
        </div>

        {/* User */}
        <div className="p-2 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 h-auto py-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">MK</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Marketing Team</p>
                  <p className="text-xs text-muted-foreground">marketing@cu.app</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{NAV_ITEMS.find((n) => n.id === activeNav)?.name}</h1>
            <Badge variant="outline" className="text-xs">
              {selectedCU.displayName}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-64 pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="border-b px-6 py-3">
          <div className="flex gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">{stat.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{stat.value}</span>
                    <span className="text-xs text-emerald-600">{stat.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeNav === "products" && <ProductCatalogEditor cu={selectedCU} />}
          {activeNav === "content" && <ContentEditor cu={selectedCU} />}
          {activeNav === "website" && <WebsiteEditor cu={selectedCU} />}
          {activeNav === "media" && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media Library</CardTitle>
                  <CardDescription>Upload and manage images, videos, and other assets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
                    <Button variant="outline" size="sm">
                      Upload Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeNav === "analytics" && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Analytics</CardTitle>
                  <CardDescription>Track performance of your marketing content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Analytics dashboard coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
