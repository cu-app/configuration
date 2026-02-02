"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Code,
  ExternalLink,
  FileCode,
  Folder,
  GitBranch,
  Users,
  FileText,
  ChevronRight,
  Copy,
  Check,
  Eye,
  Layers,
} from "lucide-react"
import { getSourceFiles, generateVSCodeUrl, generateGitHubUrl, type SectionSourceMap } from "@/lib/source-code-map"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SourceCodeViewerProps {
  sectionId: string
  onAssignTeamMember?: (sectionId: string, member: string) => void
}

export function SourceCodeViewer({ sectionId, onAssignTeamMember }: SourceCodeViewerProps) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null)
  const sourceMap = getSourceFiles(sectionId)

  if (!sourceMap) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Source code map not found for this section</div>
        </CardContent>
      </Card>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPath(text)
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const openInVSCode = (filePath: string, line?: number) => {
    const url = generateVSCodeUrl(filePath, line)
    window.open(url, "_blank")
  }

  const openInGitHub = (filePath: string, line?: number) => {
    const url = generateGitHubUrl(filePath, line)
    window.open(url, "_blank")
  }

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case "component":
        return <FileCode className="h-4 w-4" />
      case "api":
        return <Code className="h-4 w-4" />
      case "lib":
        return <Folder className="h-4 w-4" />
      case "config":
        return <FileText className="h-4 w-4" />
      default:
        return <FileCode className="h-4 w-4" />
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "complex":
        return "bg-orange-500"
      case "enterprise":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Source Code
            </CardTitle>
            <CardDescription className="mt-1">
              {sourceMap.sectionName} • {sourceMap.linesOfCode.toLocaleString()} lines of code
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getComplexityColor(sourceMap.complexity)} text-white border-0`}>
              {sourceMap.complexity}
            </Badge>
            {sourceMap.teamMember && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {sourceMap.teamMember}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Files */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Primary Files ({sourceMap.primaryFiles.length})
          </h3>
          <div className="space-y-2">
            {sourceMap.primaryFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-muted-foreground">{getFileTypeIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground truncate">{file.path}</code>
                      <Badge variant="outline" className="text-xs">
                        {file.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{file.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(file.path)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedPath === file.path ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy path</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInVSCode(file.path, file.line)}
                          className="h-8 w-8 p-0"
                        >
                          <Code className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open in VS Code</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInGitHub(file.path, file.line)}
                          className="h-8 w-8 p-0"
                        >
                          <GitBranch className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View on GitHub</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related Files */}
        {sourceMap.relatedFiles.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Related Files ({sourceMap.relatedFiles.length})</h3>
            <div className="space-y-2">
              {sourceMap.relatedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs font-mono">{file.path}</code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openInVSCode(file.path)}
                    className="h-7 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {sourceMap.dependencies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Dependencies ({sourceMap.dependencies.length})</h3>
            <div className="flex flex-wrap gap-2">
              {sourceMap.dependencies.map((dep, index) => (
                <Badge key={index} variant="outline" className="font-mono text-xs">
                  {dep}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sourceMap.primaryFiles.forEach((file) => openInVSCode(file.path))
              }}
            >
              <Code className="h-4 w-4 mr-2" />
              Open All in VS Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allFiles = [...sourceMap.primaryFiles, ...sourceMap.relatedFiles]
                allFiles.forEach((file) => openInGitHub(file.path))
              }}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              View All on GitHub
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
