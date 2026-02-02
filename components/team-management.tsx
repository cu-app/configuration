"use client"

import { useState, useEffect } from "react"
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  Eye,
  Pencil,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Copy,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth, CONFIG_SECTIONS, type TeamRole, type ConfigSection } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

// ============================================================================
// TYPES
// ============================================================================

interface TeamMember {
  id: string
  tenantId: string
  userId: string | null
  email: string
  name: string
  role: TeamRole
  avatarUrl?: string
  invitedAt: string
  acceptedAt?: string | null
  lastActiveAt?: string | null
}

interface SectionPermission {
  sectionId: ConfigSection
  canView: boolean
  canEdit: boolean
}

interface AuditLogEntry {
  id: string
  action: string
  userEmail: string
  userName: string
  sectionId?: string
  changeSummary?: string
  createdAt: string
}

// ============================================================================
// SECTION LABELS
// ============================================================================

const SECTION_LABELS: Record<ConfigSection, string> = {
  identity: "Identity & Brand",
  tokens: "Design Tokens",
  features: "Feature Flags",
  ivr: "IVR & Voice",
  products: "Product Configuration",
  rules: "Business Rules",
  fraud: "Fraud & Risk",
  compliance: "Compliance",
  integrations: "Integrations",
  channels: "Channels",
  notifications: "Notifications",
  content: "Content & Copy",
  ux: "UX Settings",
  ai: "AI Coaching",
  deploy: "Deployment",
  poweron: "PowerOn Specs",
}

const ROLE_LABELS: Record<TeamRole, { label: string; description: string; color: string }> = {
  owner: { label: "Owner", description: "Full access, can manage team", color: "bg-purple-500" },
  admin: { label: "Admin", description: "Full access, can manage team", color: "bg-blue-500" },
  editor: { label: "Editor", description: "Edit assigned sections", color: "bg-green-500" },
  viewer: { label: "Viewer", description: "View only access", color: "bg-gray-500" },
}

// ============================================================================
// INVITE DIALOG
// ============================================================================

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onInvite: (email: string, name: string, role: TeamRole) => Promise<void>
}

function InviteDialog({ open, onOpenChange, tenantId, onInvite }: InviteDialogProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<TeamRole>("editor")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleInvite = async () => {
    if (!email || !name) {
      toast({ title: "Error", description: "Email and name are required", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await onInvite(email, name, role)
      toast({ title: "Invitation sent", description: `${name} has been invited as ${role}` })
      onOpenChange(false)
      setEmail("")
      setName("")
      setRole("editor")
    } catch (error) {
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your credit union's configuration team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@creditunion.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", ROLE_LABELS.admin.color)} />
                    <span>Admin</span>
                    <span className="text-muted-foreground text-xs">- Full access</span>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", ROLE_LABELS.editor.color)} />
                    <span>Editor</span>
                    <span className="text-muted-foreground text-xs">- Edit assigned sections</span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", ROLE_LABELS.viewer.color)} />
                    <span>Viewer</span>
                    <span className="text-muted-foreground text-xs">- View only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// PERMISSION MATRIX
// ============================================================================

interface PermissionMatrixProps {
  members: TeamMember[]
  permissions: Map<string, SectionPermission[]>
  onUpdatePermission: (memberId: string, sectionId: ConfigSection, canView: boolean, canEdit: boolean) => void
}

function PermissionMatrix({ members, permissions, onUpdatePermission }: PermissionMatrixProps) {
  const editableMembers = members.filter((m) => m.role === "editor")

  if (editableMembers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No editors to configure.</p>
        <p className="text-sm">Owners and admins have full access. Viewers have read-only access.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="h-[400px]">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left p-3 font-medium text-sm">Section</th>
              {editableMembers.map((member) => (
                <th key={member.id} className="text-center p-3 font-medium text-sm min-w-[120px]">
                  <div className="flex flex-col items-center gap-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[100px]">{member.name.split(" ")[0]}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONFIG_SECTIONS.map((section, idx) => {
              return (
                <tr key={section} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-3 text-sm">{SECTION_LABELS[section]}</td>
                  {editableMembers.map((member) => {
                    const memberPerms = permissions.get(member.id) || []
                    const sectionPerm = memberPerms.find((p) => p.sectionId === section)
                    const canView = sectionPerm?.canView ?? false
                    const canEdit = sectionPerm?.canEdit ?? false

                    return (
                      <td key={member.id} className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className={cn(
                              "p-1 rounded transition-colors",
                              canView ? "bg-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground"
                            )}
                            onClick={() => onUpdatePermission(member.id, section, !canView, canView ? false : canEdit)}
                            title={canView ? "Can view" : "Cannot view"}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className={cn(
                              "p-1 rounded transition-colors",
                              canEdit ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                            )}
                            onClick={() => onUpdatePermission(member.id, section, canEdit ? canView : true, !canEdit)}
                            title={canEdit ? "Can edit" : "Cannot edit"}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

// ============================================================================
// MEMBER CARD
// ============================================================================

interface MemberCardProps {
  member: TeamMember
  isCurrentUser: boolean
  canManage: boolean
  onChangeRole: (role: TeamRole) => void
  onRemove: () => void
}

function MemberCard({ member, isCurrentUser, canManage, onChangeRole, onRemove }: MemberCardProps) {
  const roleConfig = ROLE_LABELS[member.role]

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback>
          {member.name.split(" ").map((n) => n[0]).join("")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{member.name}</span>
          {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
        </div>
        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <div className={cn("h-2 w-2 rounded-full", roleConfig.color)} />
          {roleConfig.label}
        </Badge>

        {member.acceptedAt ? (
          <Badge variant="outline" className="gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-yellow-600">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )}

        {canManage && !isCurrentUser && member.role !== "owner" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeRole("admin")}>
                <div className={cn("h-2 w-2 rounded-full mr-2", ROLE_LABELS.admin.color)} />
                Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeRole("editor")}>
                <div className={cn("h-2 w-2 rounded-full mr-2", ROLE_LABELS.editor.color)} />
                Editor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeRole("viewer")}>
                <div className={cn("h-2 w-2 rounded-full mr-2", ROLE_LABELS.viewer.color)} />
                Viewer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onRemove}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TeamManagementProps {
  tenantId: string
  tenantName: string
}

export function TeamManagement({ tenantId, tenantName }: TeamManagementProps) {
  const auth = useAuth()
  const { toast } = useToast()
  const supabase = createClient()

  const [members, setMembers] = useState<TeamMember[]>([])
  const [permissions, setPermissions] = useState<Map<string, SectionPermission[]>>(new Map())
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)

  // Load team data
  useEffect(() => {
    loadTeamData()
  }, [tenantId])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from("cu_team_members")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("role", { ascending: true })

      if (membersError) throw membersError

      const loadedMembers: TeamMember[] = (membersData || []).map((m) => ({
        id: m.id,
        tenantId: m.tenant_id,
        userId: m.user_id,
        email: m.email,
        name: m.name,
        role: m.role as TeamRole,
        avatarUrl: m.avatar_url,
        invitedAt: m.invited_at,
        acceptedAt: m.accepted_at,
        lastActiveAt: m.last_active_at,
      }))

      setMembers(loadedMembers)

      // Load permissions for editors
      const editorIds = loadedMembers.filter((m) => m.role === "editor").map((m) => m.id)
      if (editorIds.length > 0) {
        const { data: permsData } = await supabase
          .from("cu_section_permissions")
          .select("*")
          .in("team_member_id", editorIds)

        const permsMap = new Map<string, SectionPermission[]>()
        for (const perm of permsData || []) {
          const existing = permsMap.get(perm.team_member_id) || []
          existing.push({
            sectionId: perm.section_id as ConfigSection,
            canView: perm.can_view,
            canEdit: perm.can_edit,
          })
          permsMap.set(perm.team_member_id, existing)
        }
        setPermissions(permsMap)
      }

      // Load audit log
      const { data: auditData } = await supabase
        .from("cu_audit_log")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(50)

      setAuditLog(
        (auditData || []).map((a) => ({
          id: a.id,
          action: a.action,
          userEmail: a.user_email || "",
          userName: a.user_name || "",
          sectionId: a.section_id,
          changeSummary: a.change_summary,
          createdAt: a.created_at,
        }))
      )
    } catch (error) {
      console.error("Failed to load team data:", error)
      toast({ title: "Error", description: "Failed to load team data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (email: string, name: string, role: TeamRole) => {
    const { error } = await supabase.from("cu_team_members").insert({
      tenant_id: tenantId,
      email,
      name,
      role,
      invited_at: new Date().toISOString(),
    })

    if (error) throw error

    // Log the action
    await supabase.from("cu_audit_log").insert({
      tenant_id: tenantId,
      user_email: auth.user?.email,
      user_name: auth.user?.email?.split("@")[0],
      action: "team.invite",
      change_summary: `Invited ${name} (${email}) as ${role}`,
    })

    await loadTeamData()
  }

  const handleChangeRole = async (memberId: string, newRole: TeamRole) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    const { error } = await supabase
      .from("cu_team_members")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", memberId)

    if (error) {
      toast({ title: "Error", description: "Failed to change role", variant: "destructive" })
      return
    }

    // Log the action
    await supabase.from("cu_audit_log").insert({
      tenant_id: tenantId,
      user_email: auth.user?.email,
      user_name: auth.user?.email?.split("@")[0],
      action: "team.role_change",
      change_summary: `Changed ${member.name}'s role from ${member.role} to ${newRole}`,
    })

    toast({ title: "Role updated", description: `${member.name} is now ${newRole}` })
    await loadTeamData()
  }

  const handleRemove = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    const { error } = await supabase.from("cu_team_members").delete().eq("id", memberId)

    if (error) {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" })
      return
    }

    // Log the action
    await supabase.from("cu_audit_log").insert({
      tenant_id: tenantId,
      user_email: auth.user?.email,
      user_name: auth.user?.email?.split("@")[0],
      action: "team.remove",
      change_summary: `Removed ${member.name} (${member.email})`,
    })

    toast({ title: "Member removed", description: `${member.name} has been removed from the team` })
    await loadTeamData()
  }

  const handleUpdatePermission = async (
    memberId: string,
    sectionId: ConfigSection,
    canView: boolean,
    canEdit: boolean
  ) => {
    // Upsert the permission
    const { error } = await supabase.from("cu_section_permissions").upsert(
      {
        team_member_id: memberId,
        section_id: sectionId,
        can_view: canView,
        can_edit: canEdit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_member_id,section_id" }
    )

    if (error) {
      toast({ title: "Error", description: "Failed to update permission", variant: "destructive" })
      return
    }

    // Update local state
    const newPerms = new Map(permissions)
    const memberPerms = newPerms.get(memberId) || []
    const existingIdx = memberPerms.findIndex((p) => p.sectionId === sectionId)
    if (existingIdx >= 0) {
      memberPerms[existingIdx] = { sectionId, canView, canEdit }
    } else {
      memberPerms.push({ sectionId, canView, canEdit })
    }
    newPerms.set(memberId, memberPerms)
    setPermissions(newPerms)

    // Log the action
    const member = members.find((m) => m.id === memberId)
    await supabase.from("cu_audit_log").insert({
      tenant_id: tenantId,
      user_email: auth.user?.email,
      user_name: auth.user?.email?.split("@")[0],
      action: "permission.change",
      section_id: sectionId,
      change_summary: `Updated ${member?.name}'s ${SECTION_LABELS[sectionId]} permissions: view=${canView}, edit=${canEdit}`,
    })
  }

  const canManage = auth.canManageTeam()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">{tenantName}</p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Clock className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {members.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">No Team Members</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Invite team members to collaborate on configuration.
                </p>
                {canManage && (
                  <Button onClick={() => setInviteOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite First Member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isCurrentUser={member.userId === auth.user?.id || member.email === auth.user?.email}
                  canManage={canManage}
                  onChangeRole={(role) => handleChangeRole(member.id, role)}
                  onRemove={() => handleRemove(member.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Section Permissions</CardTitle>
              <CardDescription>
                Configure which sections each Editor can view and edit.
                Owners and Admins have full access. Viewers have read-only access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionMatrix
                members={members}
                permissions={permissions}
                onUpdatePermission={handleUpdatePermission}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Recent team and configuration changes</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLog.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No audit entries yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{entry.userName || entry.userEmail}</span>
                          {" - "}
                          <span className="text-muted-foreground">{entry.changeSummary || entry.action}</span>
                        </p>
                        {entry.sectionId && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {SECTION_LABELS[entry.sectionId as ConfigSection] || entry.sectionId}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString()}{" "}
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        tenantId={tenantId}
        onInvite={handleInvite}
      />
    </div>
  )
}

export default TeamManagement
