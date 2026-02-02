/**
 * Supabase table mappings for lobby / ANI / IVR.
 * Defines table schemas and config path mappings for MCP and config-mapper.
 */

export interface TableSchema {
  table: string
  columns: string[]
  configPath?: string
  tenantScoped?: boolean
}

export const ANI_IVR_TABLE_SCHEMAS: TableSchema[] = [
  {
    table: "ani_mappings",
    columns: [
      "id",
      "phone_number",
      "normalized_phone",
      "member_number",
      "tax_id",
      "member_id",
      "is_primary",
      "is_active",
      "source_system",
      "export_date",
      "created_at",
      "updated_at",
    ],
    configPath: "channels.ivr",
    tenantScoped: false,
  },
  {
    table: "ivr_sessions",
    columns: [
      "id",
      "tenant_id",
      "ucid",
      "ani",
      "dnis",
      "call_direction",
      "member_id",
      "account_number",
      "verified",
      "verification_method",
      "started_at",
      "answered_at",
      "ended_at",
      "status",
    ],
    configPath: "channels.ivr",
    tenantScoped: true,
  },
  {
    table: "members",
    columns: [
      "id",
      "tenant_id",
      "member_number",
      "account_number",
      "first_name",
      "last_name",
      "email",
      "phone",
      "created_at",
      "updated_at",
    ],
    configPath: "tenant",
    tenantScoped: true,
  },
  {
    table: "member_phones",
    columns: [
      "id",
      "member_id",
      "phone_number",
      "normalized_phone",
      "is_primary",
      "phone_type",
    ],
    configPath: "channels.ivr",
    tenantScoped: false,
  },
  {
    table: "ivr_calls",
    columns: [
      "id",
      "session_id",
      "ani",
      "started_at",
      "ended_at",
      "duration_seconds",
    ],
    configPath: "channels.ivr",
    tenantScoped: false,
  },
]

export const LOBBY_CONFIG_PATH_BY_TABLE: Record<string, string> = {
  ani_mappings: "channels.ivr",
  ivr_sessions: "channels.ivr",
  members: "tenant",
  member_phones: "channels.ivr",
  ivr_calls: "channels.ivr",
  cu_configs: "tenant",
}

export function getTableSchema(tableName: string): TableSchema | undefined {
  return ANI_IVR_TABLE_SCHEMAS.find((s) => s.table === tableName)
}

export function getConfigPathForTable(tableName: string): string | undefined {
  return LOBBY_CONFIG_PATH_BY_TABLE[tableName]
}
