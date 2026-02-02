/**
 * Map lobby state and features to IVR config.
 * Syncs call context and IVR menu structure for voice channel.
 */

import type { IVRMenu } from "@/types/unified-config"

export interface LobbyStateForIVR {
  ucid: string
  ani?: string
  selectedMemberNumber?: string | null
  isVerified?: boolean
  isIdentified?: boolean
}

export interface IVRMenuConfig {
  main_number: string
  menu_structure: IVRMenu[]
  welcome_message?: string
}

/**
 * Map lobby state to IVR menu and call context.
 */
export function mapLobbyStateToIVR(
  lobbyState: LobbyStateForIVR,
  baseMenu: IVRMenu[] = []
): {
  call_context: { ucid: string; ani?: string; member_number?: string; verified?: boolean }
  menu: IVRMenuConfig
} {
  const call_context = {
    ucid: lobbyState.ucid,
    ani: lobbyState.ani,
    member_number: lobbyState.selectedMemberNumber ?? undefined,
    verified: lobbyState.isVerified,
  }
  const menu: IVRMenuConfig = {
    main_number: "",
    menu_structure: baseMenu.length > 0 ? baseMenu : [
      { key: "1", label: "Account balance", action: "submenu" },
      { key: "2", label: "Member services", action: "submenu" },
      { key: "0", label: "Agent", action: "transfer" },
    ],
    welcome_message: "Thank you for calling. Please listen to the following options.",
  }
  return { call_context, menu }
}

/**
 * Build IVR menu structure from config for ANI lookup flow.
 */
export function getIVRMenuForANIFlow(): IVRMenu[] {
  return [
    { key: "1", label: "Account balance", action: "info" },
    { key: "2", label: "Transfer", action: "submenu" },
    { key: "3", label: "Member lookup", action: "info" },
    { key: "0", label: "Speak to representative", action: "transfer", destination: "agent" },
  ]
}
