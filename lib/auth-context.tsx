"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = "superadmin" | "cu_admin" | "cu_member"
export type TeamRole = "owner" | "admin" | "editor" | "viewer"

export const CONFIG_SECTIONS = [
  "identity",
  "tokens",
  "features",
  "ivr",
  "products",
  "rules",
  "fraud",
  "compliance",
  "integrations",
  "channels",
  "notifications",
  "content",
  "ux",
  "ai",
  "deploy",
  "poweron",
] as const

export type ConfigSection = (typeof CONFIG_SECTIONS)[number]

export interface SectionPermission {
  sectionId: ConfigSection
  canView: boolean
  canEdit: boolean
}

export interface TeamMember {
  id: string
  tenantId: string
  userId: string | null
  email: string
  name: string
  role: TeamRole
  avatarUrl?: string
  invitedAt: string
  acceptedAt?: string
  lastActiveAt?: string
}

export interface Tenant {
  id: string
  name: string
  charterNumber?: string
  logoUrl?: string
}

export interface PilotApplication {
  id: string
  status: "pending" | "approved" | "rejected"
  cuName: string
  charterNumber: string
  submittedAt: string
  approvedAt: string | null
}

export interface AuthState {
  // Auth state
  user: User | null
  loading: boolean
  error: string | null

  // Pilot enrollment (sign-in required, then enroll for platform + downloads)
  pilotEnrollment: PilotApplication | null
  isPilotEnrolled: boolean
  refreshPilotStatus: () => Promise<void>

  // Tenant context
  tenant: Tenant | null
  tenants: Tenant[] // All tenants user has access to
  teamRole: TeamRole | null

  // Computed role (superadmin sees all, others are scoped)
  role: UserRole

  // Permissions
  permissions: SectionPermission[]

  // Team
  teamMembers: TeamMember[]

  // Actions
  switchTenant: (tenantId: string) => Promise<void>
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>

  // Permission helpers
  canView: (section: ConfigSection) => boolean
  canEdit: (section: ConfigSection) => boolean
  isSuperAdmin: () => boolean
  canManageTeam: () => boolean
  canDeploy: () => boolean
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthState | null>(null)

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
  // For development: force a specific role
  devRole?: UserRole
  devTenantId?: string
}

export function AuthProvider({ children, devRole, devTenantId }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [teamRole, setTeamRole] = useState<TeamRole | null>(null)
  const [permissions, setPermissions] = useState<SectionPermission[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pilotEnrollment, setPilotEnrollment] = useState<PilotApplication | null>(null)

  const supabase = createClient()

  const isPilotEnrolled = pilotEnrollment != null && pilotEnrollment.status !== "rejected"

  const refreshPilotStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/pilot/me", { credentials: "include" })
      const data = await res.json()
      if (data.application) {
        setPilotEnrollment({
          id: data.application.id,
          status: data.application.status,
          cuName: data.application.cuName,
          charterNumber: data.application.charterNumber,
          submittedAt: data.application.submittedAt,
          approvedAt: data.application.approvedAt ?? null,
        })
      } else {
        setPilotEnrollment(null)
      }
    } catch {
      setPilotEnrollment(null)
    }
  }, [])

  // Determine effective role
  const role: UserRole = devRole || (
    // Superadmin check (email domain or specific users)
    user?.email?.endsWith("@cu.app") || user?.email?.endsWith("@cuos.com")
      ? "superadmin"
      : teamRole === "owner" || teamRole === "admin"
        ? "cu_admin"
        : "cu_member"
  )

  // Load user's tenants and permissions
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Get all tenants user belongs to
      const { data: teamMemberships, error: teamError } = await supabase
        .from("cu_team_members")
        .select(`
          id,
          tenant_id,
          role,
          email,
          name,
          avatar_url,
          invited_at,
          accepted_at,
          last_active_at
        `)
        .eq("user_id", userId)

      if (teamError) {
        console.warn("[auth] Could not load team memberships:", teamError)
        // For dev mode, create a mock tenant
        if (devTenantId) {
          setTenants([{ id: devTenantId, name: "Development Tenant" }])
          setTenant({ id: devTenantId, name: "Development Tenant" })
          setTeamRole("owner")
          setPermissions(CONFIG_SECTIONS.map(s => ({ sectionId: s, canView: true, canEdit: true })))
        }
        return
      }

      if (!teamMemberships || teamMemberships.length === 0) {
        // User has no tenant access
        setTenants([])
        setTenant(null)
        setTeamRole(null)
        setPermissions([])
        return
      }

      // Get tenant details
      const tenantIds = teamMemberships.map((m) => m.tenant_id)
      const { data: tenantConfigs } = await supabase
        .from("cu_configs")
        .select("tenant_id, tenant_name, config")
        .in("tenant_id", tenantIds)

      const loadedTenants: Tenant[] = teamMemberships.map((m) => {
        const config = tenantConfigs?.find((c) => c.tenant_id === m.tenant_id)
        return {
          id: m.tenant_id,
          name: config?.tenant_name || m.tenant_id,
          charterNumber: config?.config?.tenant?.charter_number,
          logoUrl: config?.config?.tokens?.logo?.primary,
        }
      })

      setTenants(loadedTenants)

      // Set current tenant (first one or from localStorage)
      const savedTenantId = typeof window !== "undefined" ? localStorage.getItem("cu_current_tenant") : null
      const currentTenantId = savedTenantId && tenantIds.includes(savedTenantId) ? savedTenantId : tenantIds[0]
      const currentTenant = loadedTenants.find((t) => t.id === currentTenantId) || loadedTenants[0]
      setTenant(currentTenant)

      // Set role for current tenant
      const membership = teamMemberships.find((m) => m.tenant_id === currentTenantId)
      setTeamRole(membership?.role as TeamRole || null)

      // Load permissions for current tenant
      if (membership) {
        await loadPermissions(membership.id, membership.role as TeamRole)
        await loadTeamMembers(currentTenantId)
      }
    } catch (err) {
      console.error("[auth] Error loading user data:", err)
      setError("Failed to load user data")
    }
  }, [supabase, devTenantId])

  // Load section permissions for a team member
  const loadPermissions = async (teamMemberId: string, role: TeamRole) => {
    // Owner and admin have full access
    if (role === "owner" || role === "admin") {
      setPermissions(CONFIG_SECTIONS.map((s) => ({ sectionId: s, canView: true, canEdit: true })))
      return
    }

    // Viewer has view-only access
    if (role === "viewer") {
      setPermissions(CONFIG_SECTIONS.map((s) => ({ sectionId: s, canView: true, canEdit: false })))
      return
    }

    // Editor: load specific permissions
    const { data: sectionPerms } = await supabase
      .from("cu_section_permissions")
      .select("section_id, can_view, can_edit")
      .eq("team_member_id", teamMemberId)

    if (sectionPerms) {
      setPermissions(
        CONFIG_SECTIONS.map((s) => {
          const perm = sectionPerms.find((p) => p.section_id === s)
          return {
            sectionId: s,
            canView: perm?.can_view ?? false,
            canEdit: perm?.can_edit ?? false,
          }
        })
      )
    } else {
      // No permissions set - default to no access
      setPermissions(CONFIG_SECTIONS.map((s) => ({ sectionId: s, canView: false, canEdit: false })))
    }
  }

  // Load team members for current tenant
  const loadTeamMembers = async (tenantId: string) => {
    const { data } = await supabase
      .from("cu_team_members")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("role", { ascending: true })

    if (data) {
      setTeamMembers(
        data.map((m) => ({
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
      )
    }
  }

  // Switch to a different tenant
  const switchTenant = async (tenantId: string) => {
    const newTenant = tenants.find((t) => t.id === tenantId)
    if (!newTenant) return

    setTenant(newTenant)
    if (typeof window !== "undefined") {
      localStorage.setItem("cu_current_tenant", tenantId)
    }

    // Reload permissions and team for new tenant
    if (user) {
      const { data: membership } = await supabase
        .from("cu_team_members")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("tenant_id", tenantId)
        .single()

      if (membership) {
        setTeamRole(membership.role as TeamRole)
        await loadPermissions(membership.id, membership.role as TeamRole)
        await loadTeamMembers(tenantId)
      }
    }
  }

  // Refresh auth state
  const refreshAuth = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await loadUserData(user.id)
      }
    } catch (err) {
      console.error("[auth] Refresh error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTenant(null)
    setTenants([])
    setTeamRole(null)
    setPermissions([])
    setTeamMembers([])
    setPilotEnrollment(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("cu_current_tenant")
    }
  }

  // Permission helpers
  const canView = (section: ConfigSection): boolean => {
    if (role === "superadmin") return true
    if (teamRole === "owner" || teamRole === "admin" || teamRole === "viewer") return true
    const perm = permissions.find((p) => p.sectionId === section)
    return perm?.canView ?? false
  }

  const canEdit = (section: ConfigSection): boolean => {
    if (role === "superadmin") return true
    if (teamRole === "owner" || teamRole === "admin") return true
    if (teamRole === "viewer") return false
    const perm = permissions.find((p) => p.sectionId === section)
    return perm?.canEdit ?? false
  }

  const isSuperAdmin = (): boolean => role === "superadmin"

  const canManageTeam = (): boolean => {
    if (role === "superadmin") return true
    return teamRole === "owner" || teamRole === "admin"
  }

  const canDeploy = (): boolean => {
    if (role === "superadmin") return true
    return teamRole === "owner" || teamRole === "admin"
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          await loadUserData(user.id)
          await refreshPilotStatus()
        } else {
          setPilotEnrollment(null)
        }
        if (!user && devTenantId) {
          // Dev mode without auth
          setTenants([{ id: devTenantId, name: "Development Tenant" }])
          setTenant({ id: devTenantId, name: "Development Tenant" })
          setTeamRole("owner")
          setPermissions(CONFIG_SECTIONS.map(s => ({ sectionId: s, canView: true, canEdit: true })))
          setPilotEnrollment({
            id: "dev-pilot",
            status: "approved",
            cuName: "Development Tenant",
            charterNumber: "00000",
            submittedAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error("[auth] Init error:", err)
        setError("Failed to initialize authentication")
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        await loadUserData(session.user.id)
        await refreshPilotStatus()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setTenant(null)
        setTenants([])
        setTeamRole(null)
        setPermissions([])
        setTeamMembers([])
        setPilotEnrollment(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserData, refreshPilotStatus, supabase, devTenantId])

  const value: AuthState = {
    user,
    loading,
    error,
    pilotEnrollment,
    isPilotEnrolled,
    refreshPilotStatus,
    tenant,
    tenants,
    teamRole,
    role,
    permissions,
    teamMembers,
    switchTenant,
    refreshAuth,
    signOut,
    canView,
    canEdit,
    isSuperAdmin,
    canManageTeam,
    canDeploy,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// ============================================================================
// DEVELOPMENT HELPER
// ============================================================================

/**
 * For development: wraps AuthProvider with default dev settings
 * Shows CU picker for all users, simulates superadmin
 */
export function DevAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider devRole="superadmin" devTenantId="dev_tenant">
      {children}
    </AuthProvider>
  )
}
