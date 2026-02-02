"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Layers,
  Code,
  Users,
  GitBranch,
  Database,
  FileCode,
  Folder,
  Search,
  ArrowRight,
} from "lucide-react"
import { getAllSections } from "@/lib/source-code-map"
import { SourceCodeViewer } from "./source-code-viewer"
import { useState } from "react"
import { Input } from "@/components/ui/input"

export function CodebaseOverview() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const allSections = getAllSections()
  const totalLines = allSections.reduce((sum, section) => sum + section.linesOfCode, 0)
  const totalFiles = allSections.reduce((sum, section) => sum + section.primaryFiles.length, 0)

  const filteredSections = allSections.filter((section) =>
    section.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.sectionId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allSections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lines of Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLines.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,289</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>Source Code Map</CardTitle>
          </div>
          <CardDescription>Navigate to any section's source files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSections.map((section) => (
              <Card
                key={section.sectionId}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedSection === section.sectionId ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedSection(selectedSection === section.sectionId ? null : section.sectionId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{section.sectionName}</CardTitle>
                    {section.teamMember && (
                      <Badge variant="secondary" className="text-xs">
                        {section.teamMember}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileCode className="h-4 w-4" />
                      {section.primaryFiles.length} files
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Code className="h-4 w-4" />
                      {section.linesOfCode.toLocaleString()} lines
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {section.complexity}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSection(section.sectionId)
                        }}
                      >
                        View Files <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Source Code Viewer */}
      {selectedSection && (
        <SourceCodeViewer
          sectionId={selectedSection}
          onAssignTeamMember={(sectionId, member) => {
            console.log(`Assign ${sectionId} to ${member}`)
          }}
        />
      )}
    </div>
  )
}
