/**
 * SOURCE CODE MAP
 * Maps every UI section to its source files
 * Enables "View in IDE" functionality and code navigation
 */

export interface SourceFile {
  path: string
  line?: number
  description: string
  type: "component" | "api" | "lib" | "config" | "type"
  relatedFiles?: string[]
}

export interface SectionSourceMap {
  sectionId: string
  sectionName: string
  primaryFiles: SourceFile[]
  relatedFiles: SourceFile[]
  dependencies: string[]
  teamMember?: string
  complexity: "simple" | "medium" | "complex" | "enterprise"
  linesOfCode: number
}

export const SOURCE_CODE_MAP: Record<string, SectionSourceMap> = {
  "omnichannel": {
    sectionId: "omnichannel",
    sectionName: "Omnichannel Architecture",
    primaryFiles: [
      {
        path: "components/omnichannel-architecture.tsx",
        description: "Main 21-layer architecture component",
        type: "component",
      },
      {
        path: "components/omnichannel-live-view.tsx",
        description: "Live channel activity monitor",
        type: "component",
      },
      {
        path: "components/architecture-diagram.tsx",
        description: "Visual architecture flow diagram",
        type: "component",
      },
      {
        path: "app/api/omnichannel/route.ts",
        description: "Unified omnichannel API endpoint",
        type: "api",
      },
      {
        path: "app/api/ivr/genesys/route.ts",
        description: "Genesys IVR integration",
        type: "api",
      },
      {
        path: "lib/omnichannel-service.ts",
        description: "Omnichannel service client",
        type: "lib",
      },
      {
        path: "lib/core-adapter-bridge.ts",
        description: "Core banking adapter bridge",
        type: "lib",
      },
      {
        path: "lib/hume-integration.ts",
        description: "Hume AI integration",
        type: "lib",
      },
    ],
    relatedFiles: [
      { path: "OMNICHANNEL_ARCHITECTURE.md", description: "Architecture documentation", type: "config" },
      { path: "OMNICHANNEL_COMPLETE.md", description: "Complete system docs", type: "config" },
    ],
    dependencies: ["@/lib/credit-union-data", "@/lib/twiml"],
    complexity: "enterprise",
    linesOfCode: 3500,
  },
  "config": {
    sectionId: "config",
    sectionName: "Configuration Editor",
    primaryFiles: [
      {
        path: "components/cu-config-dashboard.tsx",
        description: "Main configuration dashboard",
        type: "component",
      },
      {
        path: "components/config-studio.tsx",
        description: "Config studio editor",
        type: "component",
      },
      {
        path: "app/api/config/route.ts",
        description: "Configuration API",
        type: "api",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "complex",
    linesOfCode: 8500,
  },
  "preview": {
    sectionId: "preview",
    sectionName: "App Preview",
    primaryFiles: [
      {
        path: "components/flutter-preview-simple.tsx",
        description: "Flutter app preview",
        type: "component",
      },
      {
        path: "components/flutter-device-preview.tsx",
        description: "Device preview component",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "medium",
    linesOfCode: 2200,
  },
  "uat": {
    sectionId: "uat",
    sectionName: "UAT Testing",
    primaryFiles: [
      {
        path: "components/uat-view.tsx",
        description: "UAT testing dashboard",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "medium",
    linesOfCode: 1800,
  },
  "sources": {
    sectionId: "sources",
    sectionName: "Data Sources",
    primaryFiles: [
      {
        path: "components/sources-view.tsx",
        description: "Data sources view",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "simple",
    linesOfCode: 1200,
  },
  "mapping": {
    sectionId: "mapping",
    sectionName: "Field Mapping",
    primaryFiles: [
      {
        path: "components/field-mapping-table.tsx",
        description: "Field mapping table",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "medium",
    linesOfCode: 2500,
  },
  "tokens": {
    sectionId: "tokens",
    sectionName: "Design Tokens",
    primaryFiles: [
      {
        path: "components/cu-ui-design-tokens.tsx",
        description: "CU UI design tokens editor",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "medium",
    linesOfCode: 3200,
  },
  "network": {
    sectionId: "network",
    sectionName: "CU Network",
    primaryFiles: [
      {
        path: "components/cu-network-feed.tsx",
        description: "Credit union network feed",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "medium",
    linesOfCode: 2800,
  },
  "enrichment": {
    sectionId: "enrichment",
    sectionName: "Data Discovery",
    primaryFiles: [
      {
        path: "components/discovery-dashboard.tsx",
        description: "AI-powered data discovery",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "complex",
    linesOfCode: 4500,
  },
  "github": {
    sectionId: "github",
    sectionName: "GitHub CI/CD",
    primaryFiles: [
      {
        path: "components/github-connect-dialog.tsx",
        description: "GitHub integration",
        type: "component",
      },
    ],
    relatedFiles: [],
    dependencies: [],
    complexity: "medium",
    linesOfCode: 2100,
  },
}

/**
 * Get source files for a section
 */
export function getSourceFiles(sectionId: string): SectionSourceMap | null {
  return SOURCE_CODE_MAP[sectionId] || null
}

/**
 * Get all sections
 */
export function getAllSections(): SectionSourceMap[] {
  return Object.values(SOURCE_CODE_MAP)
}

/**
 * Get sections assigned to a team member
 */
export function getSectionsByTeamMember(teamMember: string): SectionSourceMap[] {
  return Object.values(SOURCE_CODE_MAP).filter((section) => section.teamMember === teamMember)
}

/**
 * Generate VS Code URL for opening file
 */
export function generateVSCodeUrl(filePath: string, line?: number): string {
  const workspacePath = "/Users/kylekusche/Desktop/quarentine/configuration-matrix-build"
  const fullPath = `${workspacePath}/${filePath}`
  const lineParam = line ? `:${line}` : ""
  return `vscode://file${fullPath}${lineParam}`
}

/**
 * Generate GitHub URL for file
 */
export function generateGitHubUrl(filePath: string, line?: number, branch: string = "main"): string {
  const repo = "configuration-matrix-build" // Update with actual repo
  const lineParam = line ? `#L${line}` : ""
  return `https://github.com/your-org/${repo}/blob/${branch}/${filePath}${lineParam}`
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<{ lines: number; size: number } | null> {
  try {
    // In production, this would fetch actual file stats
    // For now, return mock data
    return {
      lines: Math.floor(Math.random() * 500) + 100,
      size: Math.floor(Math.random() * 50000) + 10000,
    }
  } catch {
    return null
  }
}
