// CONTENT EDITOR
// Marketing CMS for managing copy, messaging, and content blocks

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Type,
  MessageSquare,
  AlertTriangle,
  Star,
  HelpCircle,
  Edit3,
  Save,
  Copy,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface ContentEditorProps {
  cu: CreditUnionData
}

const CONTENT_SECTIONS = [
  { id: "headlines", name: "Headlines & Taglines", icon: <Type className="h-4 w-4" /> },
  { id: "cta", name: "Call to Action", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "errors", name: "Error Messages", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "testimonials", name: "Testimonials", icon: <Star className="h-4 w-4" /> },
  { id: "faq", name: "FAQ", icon: <HelpCircle className="h-4 w-4" /> },
]

interface ContentBlock {
  id: string
  key: string
  title: string
  content: string
  section: string
  ab_variant?: string
}

export function ContentEditor({ cu }: ContentEditorProps) {
  const [selectedSection, setSelectedSection] = useState("headlines")
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [contentBlocks] = useState<ContentBlock[]>([
    {
      id: "1",
      key: "hero_headline",
      title: "Hero Headline",
      content: `Welcome to ${cu.displayName}`,
      section: "headlines",
    },
    {
      id: "2",
      key: "hero_tagline",
      title: "Hero Tagline",
      content: "Banking that puts you first",
      section: "headlines",
    },
    {
      id: "3",
      key: "primary_cta",
      title: "Primary CTA",
      content: "Join Today",
      section: "cta",
    },
    {
      id: "4",
      key: "secondary_cta",
      title: "Secondary CTA",
      content: "Learn More",
      section: "cta",
    },
    {
      id: "5",
      key: "error_generic",
      title: "Generic Error",
      content: "Something went wrong. Please try again or contact support.",
      section: "errors",
    },
    {
      id: "6",
      key: "error_network",
      title: "Network Error",
      content: "Please check your internet connection and try again.",
      section: "errors",
    },
  ])

  const filteredBlocks = contentBlocks.filter((b) => b.section === selectedSection)

  return (
    <div className="flex h-full">
      {/* Sections Sidebar */}
      <div className="w-56 border-r p-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">Content Sections</p>
        <div className="space-y-1">
          {CONTENT_SECTIONS.map((section) => (
            <Button
              key={section.id}
              variant={selectedSection === section.id ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start gap-2 h-9"
              onClick={() => setSelectedSection(section.id)}
            >
              {section.icon}
              <span className="truncate">{section.name}</span>
              <Badge variant="outline" className="ml-auto text-xs h-5">
                {contentBlocks.filter((b) => b.section === section.id).length}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Content Blocks List */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-medium text-sm">{CONTENT_SECTIONS.find((s) => s.id === selectedSection)?.name}</h3>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredBlocks.map((block) => (
              <button
                key={block.id}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  selectedBlock?.id === block.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                )}
                onClick={() => {
                  setSelectedBlock(block)
                  setIsEditing(false)
                }}
              >
                <p className="font-medium text-sm">{block.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">{block.content}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedBlock ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{selectedBlock.title}</h2>
                <p className="text-sm text-muted-foreground font-mono">{selectedBlock.key}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        toast.success("Content saved")
                        setIsEditing(false)
                      }}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Textarea value={selectedBlock.content} disabled={!isEditing} rows={4} className="font-medium" />
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Sparkles className="h-3 w-3" />
                        Generate Variants
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Copy className="h-3 w-3" />
                        Duplicate
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Usage</CardTitle>
                  <CardDescription>Where this content appears</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                      <span>Website Homepage</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                      <span>Mobile App Welcome Screen</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Type className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">Select Content</h3>
              <p className="text-sm text-muted-foreground">Choose a content block to view and edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
