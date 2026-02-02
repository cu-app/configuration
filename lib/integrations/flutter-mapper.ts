/**
 * Map lobby state and features to Flutter app config.
 * Syncs member context and navigation routes for Flutter mobile app.
 */

import type { ChannelsConfig } from "@/types/unified-config"

export interface LobbyStateForFlutter {
  selectedMemberNumber: string | null
  phoneNumber?: string
  isVerified?: boolean
  isIdentified?: boolean
  ucid?: string
}

export interface FlutterNavRoute {
  path: string
  label: string
  screen: string
  params?: Record<string, string>
}

/**
 * Map lobby state to Flutter config payload (for deep link or config sync).
 */
export function mapLobbyStateToFlutter(
  lobbyState: LobbyStateForFlutter,
  channelsConfig: Partial<ChannelsConfig>
): {
  memberContext: { memberNumber: string | null; phoneNumber?: string; verified?: boolean }
  routes: FlutterNavRoute[]
} {
  const memberContext = {
    memberNumber: lobbyState.selectedMemberNumber,
    phoneNumber: lobbyState.phoneNumber,
    verified: lobbyState.isVerified,
  }
  const routes: FlutterNavRoute[] = [
    { path: "/", label: "Home", screen: "HomeScreen" },
    { path: "/lobby", label: "Lobby", screen: "LobbyScreen", params: lobbyState.ucid ? { ucid: lobbyState.ucid } : undefined },
    { path: "/member-search", label: "Member Search", screen: "MemberSearchScreen" },
    { path: "/verification", label: "Verification", screen: "VerificationScreen" },
  ]
  if (lobbyState.selectedMemberNumber) {
    routes.push({
      path: "/member-dashboard",
      label: "Member Dashboard",
      screen: "MemberDashboardScreen",
      params: { memberNumber: lobbyState.selectedMemberNumber },
    })
  }
  return { memberContext, routes }
}

/**
 * Generate Flutter navigation routes from lobby features.
 */
export function getFlutterNavRoutesFromLobby(): FlutterNavRoute[] {
  return [
    { path: "/lobby", label: "Lobby", screen: "LobbyScreen" },
    { path: "/member-search", label: "Member Search", screen: "MemberSearchScreen" },
    { path: "/verification", label: "Verification", screen: "VerificationScreen" },
    { path: "/member-dashboard", label: "Member Dashboard", screen: "MemberDashboardScreen" },
  ]
}
