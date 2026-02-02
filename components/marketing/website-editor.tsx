// WEBSITE EDITOR
// Marketing CMS for editing website pages (ivr.center style)

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Globe,
  Home,
  CreditCard,
  Phone,
  Users,
  Plus,
  Eye,
  Edit3,
  ExternalLink,
  Settings,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface WebsiteEditorProps {
  cu: CreditUnionData
}

interface PageSection {
  id: string
  type: "hero" | "features" | "products" | "testimonials" | "cta" | "contact"
  title: string
  visible: boolean
}

interface WebPage {
  id: string
  slug: string
  title: string
  icon: React.ReactNode
  is_published: boolean
  sections: PageSection[]
}

const SECTION_TYPES = [
  { type: "hero", name: "Hero Banner", icon: "🎯" },
  { type: "features", name: "Features Grid", icon: "✨" },
  { type: "products", name: "Products Showcase", icon: "💳" },
  { type: "testimonials", name: "Testimonials", icon: "⭐" },
  { type: "cta", name: "Call to Action", icon: "📢" },
  { type: "contact", name: "Contact Form", icon: "📧" },
]

export function WebsiteEditor({ cu }: WebsiteEditorProps) {
  const [selectedPage, setSelectedPage] = useState<WebPage | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [pages] = useState<WebPage[]>([
    {
      id: "1",
      slug: "/",
      title: "Homepage",
      icon: <Home className="h-4 w-4" />,
      is_published: true,
      sections: [
        { id: "s1", type: "hero", title: "Welcome Banner", visible: true },
        { id: "s2", type: "features", title: "Why Choose Us", visible: true },
        { id: "s3", type: "products", title: "Our Products", visible: true },
        { id: "s4", type: "testimonials", title: "Member Stories", visible: true },
        { id: "s5", type: "cta", title: "Join Today", visible: true },
      ],
    },
    {
      id: "2",
      slug: "/loans",
      title: "Loans",
      icon: <CreditCard className="h-4 w-4" />,
      is_published: true,
      sections: [
        { id: "s6", type: "hero", title: "Loan Products", visible: true },
        { id: "s7", type: "products", title: "Loan Options", visible: true },
        { id: "s8", type: "cta", title: "Apply Now", visible: true },
      ],
    },
    {
      id: "3",
      slug: "/about",
      title: "About Us",
      icon: <Users className="h-4 w-4" />,
      is_published: true,
      sections: [
        { id: "s9", type: "hero", title: "Our Story", visible: true },
        { id: "s10", type: "features", title: "Our Values", visible: true },
      ],
    },
    {
      id: "4",
      slug: "/contact",
      title: "Contact",
      icon: <Phone className="h-4 w-4" />,
      is_published: true,
      sections: [
        { id: "s11", type: "hero", title: "Get in Touch", visible: true },
        { id: "s12", type: "contact", title: "Contact Form", visible: true },
      ],
    },
  ])

  return (
    <div className="flex h-full">
      {/* Pages Sidebar */}
      <div className="w-56 border-r flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</p>
          <Button size="sm" variant="ghost" className="h-7 px-2">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {pages.map((page) => (
              <button
                key={page.id}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg border transition-colors flex items-center gap-2",
                  selectedPage?.id === page.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                )}
                onClick={() => {
                  setSelectedPage(page)
                  setIsEditing(false)
                }}
              >
                {page.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{page.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{page.slug}</p>
                </div>
                {page.is_published && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
            <Globe className="h-4 w-4" />
            View Site
            <ExternalLink className="h-3 w-3 ml-auto" />
          </Button>
        </div>
      </div>

      {/* Page Editor */}
      <div className="flex-1 flex flex-col">
        {selectedPage ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedPage.icon}
                <div>
                  <h2 className="font-semibold">{selectedPage.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedPage.slug}</p>
                </div>
                {selectedPage.is_published ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Published
                  </Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                {!isEditing ? (
                  <Button size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                    Edit Page
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(false)}>
                    Done Editing
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sections List */}
              <div className="w-72 border-r flex flex-col">
                <div className="p-3 border-b flex items-center justify-between">
                  <p className="text-sm font-medium">Page Sections</p>
                  {isEditing && (
                    <Button size="sm" variant="ghost" className="h-7 px-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {selectedPage.sections.map((section, index) => (
                      <div
                        key={section.id}
                        className={cn("p-3 rounded-lg border bg-card", !section.visible && "opacity-50")}
                      >
                        <div className="flex items-center gap-2">
                          {isEditing && (
                            <div className="flex flex-col">
                              <button className="p-0.5 hover:bg-muted rounded" disabled={index === 0}>
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                className="p-0.5 hover:bg-muted rounded"
                                disabled={index === selectedPage.sections.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span>{SECTION_TYPES.find((s) => s.type === section.type)?.icon}</span>
                              <p className="text-sm font-medium truncate">{section.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">{section.type}</p>
                          </div>
                          {isEditing && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {isEditing && (
                  <div className="p-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Add Section</p>
                    <div className="grid grid-cols-2 gap-1">
                      {SECTION_TYPES.map((type) => (
                        <Button
                          key={type.type}
                          variant="outline"
                          size="sm"
                          className="h-auto py-2 flex-col gap-1 bg-transparent"
                        >
                          <span>{type.icon}</span>
                          <span className="text-xs">{type.name.split(" ")[0]}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Area */}
              <div className="flex-1 bg-muted/30 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Page Preview</CardTitle>
                      <CardDescription>Live preview of {selectedPage.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden bg-background">
                        {/* Mock Website Header */}
                        <div className="h-14 border-b flex items-center px-4 gap-4">
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: cu.primaryColor }}
                          >
                            {cu.displayName.substring(0, 2)}
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="font-medium">Home</span>
                            <span className="text-muted-foreground">Loans</span>
                            <span className="text-muted-foreground">Accounts</span>
                            <span className="text-muted-foreground">About</span>
                          </div>
                          <div className="ml-auto">
                            <Button size="sm" style={{ backgroundColor: cu.primaryColor }}>
                              Login
                            </Button>
                          </div>
                        </div>

                        {/* Mock Sections */}
                        {selectedPage.sections
                          .filter((s) => s.visible)
                          .map((section) => (
                            <div
                              key={section.id}
                              className="border-b last:border-b-0 p-8"
                              style={{
                                backgroundColor: section.type === "hero" ? `${cu.primaryColor}10` : undefined,
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {section.type}
                                </Badge>
                              </div>
                              <p className="font-semibold">{section.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Section content will be displayed here...
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">Select a Page</h3>
              <p className="text-sm text-muted-foreground">
                Choose a page from the list to edit its content and layout
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
