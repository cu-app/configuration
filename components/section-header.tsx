"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, ExternalLink, Users, GitBranch, Eye } from "lucide-react"
import { getSourceFiles, generateVSCodeUrl, generateGitHubUrl } from "@/lib/source-code-map"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SectionHeaderProps {
  sectionId: string
  title: string
  description?: string
  onAssignTeamMember?: (member: string) => void
  teamMembers?: string[]
}

export function SectionHeader({
  sectionId,
  title,
  description,
  onAssignTeamMember,
  teamMembers = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams"],
}: SectionHeaderProps) {
  const sourceMap = getSourceFiles(sectionId)

  const openAllInVSCode = () => {
    if (sourceMap) {
      sourceMap.primaryFiles.forEach((file) => {
        const url = generateVSCodeUrl(file.path, file.line)
        window.open(url, "_blank")
      })
    }
  }

  const openAllInGitHub = () => {
    if (sourceMap) {
      sourceMap.primaryFiles.forEach((file) => {
        const url = generateGitHubUrl(file.path, file.line)
        window.open(url, "_blank")
      })
    }
  }

  return (
    <div className="flex items-start justify-between mb-6 pb-4 border-b">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          {sourceMap && (
            <Badge variant="outline" className="text-xs">
              {sourceMap.primaryFiles.length} files • {sourceMap.linesOfCode.toLocaleString()} lines
            </Badge>
          )}
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {/* View Source Dropdown */}
        {sourceMap && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Code className="h-4 w-4 mr-2" />
                View Source
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Source Code</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openAllInVSCode}>
                <Code className="h-4 w-4 mr-2" />
                Open All in VS Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openAllInGitHub}>
                <GitBranch className="h-4 w-4 mr-2" />
                View All on GitHub
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sourceMap.primaryFiles.slice(0, 5).map((file, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => {
                    const url = generateVSCodeUrl(file.path, file.line)
                    window.open(url, "_blank")
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="truncate">{file.path}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Assign Team Member */}
        {onAssignTeamMember && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Assign to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {teamMembers.map((member) => (
                <DropdownMenuItem key={member} onClick={() => onAssignTeamMember(member)}>
                  {member}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
