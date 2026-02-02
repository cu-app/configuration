/**
 * TEAM ASSIGNMENT SYSTEM
 * Manages team member assignments to sections
 * Enables delegation and collaboration
 */

export interface TeamMember {
  id: string
  name: string
  email: string
  role: "developer" | "designer" | "qa" | "pm" | "architect"
  avatar?: string
  sections: string[]
}

export interface SectionAssignment {
  sectionId: string
  assignedTo: string | null
  assignedAt: string | null
  assignedBy: string | null
  status: "assigned" | "in-progress" | "review" | "completed"
  notes?: string
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "john-doe",
    name: "John Doe",
    email: "john@example.com",
    role: "developer",
    sections: ["omnichannel", "config"],
  },
  {
    id: "jane-smith",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "designer",
    sections: ["preview", "tokens"],
  },
  {
    id: "bob-johnson",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "qa",
    sections: ["uat"],
  },
  {
    id: "alice-williams",
    name: "Alice Williams",
    email: "alice@example.com",
    role: "architect",
    sections: ["omnichannel", "sources"],
  },
]

const SECTION_ASSIGNMENTS: Record<string, SectionAssignment> = {
  omnichannel: {
    sectionId: "omnichannel",
    assignedTo: "john-doe",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    status: "in-progress",
    notes: "Working on 21-layer architecture integration",
  },
  config: {
    sectionId: "config",
    assignedTo: "john-doe",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    status: "in-progress",
  },
  preview: {
    sectionId: "preview",
    assignedTo: "jane-smith",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    status: "in-progress",
  },
  uat: {
    sectionId: "uat",
    assignedTo: "bob-johnson",
    assignedAt: new Date().toISOString(),
    assignedBy: "admin",
    status: "in-progress",
  },
}

/**
 * Get team member by ID
 */
export function getTeamMember(id: string): TeamMember | null {
  return TEAM_MEMBERS.find((m) => m.id === id) || null
}

/**
 * Get all team members
 */
export function getAllTeamMembers(): TeamMember[] {
  return TEAM_MEMBERS
}

/**
 * Get sections assigned to a team member
 */
export function getSectionsByTeamMember(memberId: string): string[] {
  return Object.values(SECTION_ASSIGNMENTS)
    .filter((assignment) => assignment.assignedTo === memberId)
    .map((assignment) => assignment.sectionId)
}

/**
 * Get assignment for a section
 */
export function getSectionAssignment(sectionId: string): SectionAssignment | null {
  return SECTION_ASSIGNMENTS[sectionId] || null
}

/**
 * Assign section to team member
 */
export function assignSection(
  sectionId: string,
  memberId: string,
  assignedBy: string,
  notes?: string
): void {
  SECTION_ASSIGNMENTS[sectionId] = {
    sectionId,
    assignedTo: memberId,
    assignedAt: new Date().toISOString(),
    assignedBy,
    status: "assigned",
    notes,
  }

  // Update team member's sections
  const member = TEAM_MEMBERS.find((m) => m.id === memberId)
  if (member && !member.sections.includes(sectionId)) {
    member.sections.push(sectionId)
  }
}

/**
 * Update assignment status
 */
export function updateAssignmentStatus(sectionId: string, status: SectionAssignment["status"]): void {
  const assignment = SECTION_ASSIGNMENTS[sectionId]
  if (assignment) {
    assignment.status = status
  }
}

/**
 * Get all assignments
 */
export function getAllAssignments(): SectionAssignment[] {
  return Object.values(SECTION_ASSIGNMENTS)
}
