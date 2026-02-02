"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"

export type BridgeView = "config" | "screen-inspector" | "dual-studio"

export interface InspectorConfigBridgeState {
  /** Currently selected MX screen id (e.g. dashboard, accounts) — shared by Inspector and Config */
  selectedScreenId: string | null
  /** Tier to focus when opening Config (e.g. content) */
  selectedTierId: string | null
  setSelectedScreenId: (id: string | null) => void
  setSelectedTierId: (id: string | null) => void
  /** Switch view and optionally set screen/tier so Inspector and Config stay in sync */
  navigateToView: (view: BridgeView, screenId?: string | null, tierId?: string | null) => void
}

const InspectorConfigBridgeContext = createContext<InspectorConfigBridgeState | null>(null)

export function useInspectorConfigBridge(): InspectorConfigBridgeState {
  const ctx = useContext(InspectorConfigBridgeContext)
  if (!ctx) {
    return {
      selectedScreenId: null,
      selectedTierId: null,
      setSelectedScreenId: () => {},
      setSelectedTierId: () => {},
      navigateToView: () => {},
    }
  }
  return ctx
}

interface InspectorConfigBridgeProviderProps {
  children: ReactNode
  /** Called when navigateToView requests a view change (e.g. set nav state + URL) */
  onNavigateToView: (view: BridgeView, screenId?: string | null, tierId?: string | null) => void
}

export function InspectorConfigBridgeProvider({
  children,
  onNavigateToView,
}: InspectorConfigBridgeProviderProps) {
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null)
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null)

  const navigateToView = useCallback(
    (view: BridgeView, screenId?: string | null, tierId?: string | null) => {
      if (screenId !== undefined) setSelectedScreenId(screenId ?? null)
      if (tierId !== undefined) setSelectedTierId(tierId ?? null)
      onNavigateToView(view, screenId, tierId)
    },
    [onNavigateToView]
  )

  const value = useMemo<InspectorConfigBridgeState>(
    () => ({
      selectedScreenId,
      selectedTierId,
      setSelectedScreenId,
      setSelectedTierId,
      navigateToView,
    }),
    [selectedScreenId, selectedTierId, navigateToView]
  )

  return (
    <InspectorConfigBridgeContext.Provider value={value}>
      {children}
    </InspectorConfigBridgeContext.Provider>
  )
}
