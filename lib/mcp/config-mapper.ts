/**
 * Map Supabase table data to ChannelsConfig for Flutter and IVR.
 * Uses schema-to-config-mapper patterns and lobby table mappings.
 */

import type { ChannelsConfig, IVRMenu, VoiceConfig } from "@/types/unified-config"
import { getConfigPathForTable } from "./supabase-table-mappings"

export interface SupabaseIVRConfigRow {
  enabled?: boolean
  main_number?: string
  hume_config_id?: string
  twilio_phone_number?: string
  menu_structure?: unknown[]
  voice_provider?: string
}

export interface CuConfigRow {
  config?: {
    channels?: Partial<ChannelsConfig>
    tenant?: { name?: string; domain?: string }
  }
}

/**
 * Build partial ChannelsConfig from Supabase ivr_config row.
 */
export function mapIVRConfigToChannels(ivrRow: SupabaseIVRConfigRow | null): Partial<ChannelsConfig> {
  if (!ivrRow) return {}
  const menu_structure: IVRMenu[] = Array.isArray(ivrRow.menu_structure)
    ? (ivrRow.menu_structure as IVRMenu[])
    : []
  const voice_settings: VoiceConfig = {
    provider: (ivrRow.voice_provider as VoiceConfig["provider"]) ?? "twilio",
    voice_name: "default",
    language: "en-US",
    speed: 1,
  }
  return {
    channels: {
      ivr: {
        main_number: ivrRow.main_number ?? ivrRow.twilio_phone_number ?? "",
        menu_structure,
        voice_settings,
        integrations: {
          provider: (ivrRow.voice_provider as string) ?? "twilio",
          config: {
            hume_config_id: ivrRow.hume_config_id,
            twilio_phone_number: ivrRow.twilio_phone_number,
          },
        },
      },
    },
  } as Partial<ChannelsConfig>
}

/**
 * Build partial ChannelsConfig from cu_configs.config JSONB.
 */
export function mapCuConfigToChannels(cuConfig: CuConfigRow | null): Partial<ChannelsConfig> {
  if (!cuConfig?.config?.channels) return {}
  return {
    channels: cuConfig.config.channels as Partial<ChannelsConfig>["channels"],
  } as Partial<ChannelsConfig>
}

/**
 * Get config path for a Supabase table (for Flutter/IVR mapping).
 */
export function getChannelsConfigPath(tableName: string): string | undefined {
  return getConfigPathForTable(tableName)
}

/**
 * Merge lobby/IVR table data into a single ChannelsConfig partial.
 */
export function mergeTableDataIntoChannels(
  ivrConfigRow: SupabaseIVRConfigRow | null,
  cuConfigRow: CuConfigRow | null
): Partial<ChannelsConfig> {
  const fromCu = mapCuConfigToChannels(cuConfigRow)
  const fromIvr = mapIVRConfigToChannels(ivrConfigRow)
  return {
    channels: {
      ...fromCu.channels,
      ...fromIvr.channels,
      ivr: {
        ...fromCu.channels?.ivr,
        ...fromIvr.channels?.ivr,
      },
    },
  }
}
