/**
 * Schema to Config Mapper
 * 
 * Maps Supabase database tables (712 tables) to CU Configuration structure
 * 
 * This analyzes table schemas and creates mappings to cu-config.ts fields
 */

export interface TableColumn {
  tableName: string
  columnName: string
  dataType: string
  isNullable: boolean
  defaultValue: string | null
}

export interface ConfigFieldMapping {
  configPath: string // e.g., "tenant.name", "design.color.primary"
  configType: string // TypeScript type
  sourceTables: Array<{
    table: string
    column: string
    transform?: string // Optional transformation function
  }>
  mappingType: 'direct' | 'nested' | 'array' | 'computed' | 'jsonb'
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

/**
 * Known table to config mappings
 * Based on actual Supabase schema analysis
 */
export const KNOWN_TABLE_MAPPINGS: ConfigFieldMapping[] = [
  // Tier 1: Identity & Brand
  {
    configPath: 'tenant.id',
    configType: 'string',
    sourceTables: [
      { table: 'cu_configs', column: 'tenant_id' },
      { table: 'ncua_credit_unions', column: 'cu_number' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'tenant.name',
    configType: 'string',
    sourceTables: [
      { table: 'ncua_credit_unions', column: 'cu_name' },
      { table: 'cu_details', column: 'name' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'tenant.charter_number',
    configType: 'string',
    sourceTables: [
      { table: 'ncua_credit_unions', column: 'charter_number' },
      { table: 'cu_details', column: 'charter_number' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'tenant.domain',
    configType: 'string',
    sourceTables: [
      { table: 'domains', column: 'domain_name' },
      { table: 'cu_details', column: 'domain' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'tenant.legal.name',
    configType: 'string',
    sourceTables: [
      { table: 'ncua_credit_unions', column: 'cu_name' },
      { table: 'cu_details', column: 'legal_name' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'tenant.legal.routing',
    configType: 'string',
    sourceTables: [
      { table: 'cu_details', column: 'routing_number' },
      { table: 'ncua_credit_unions', column: 'routing_number' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'tenant.support.phone',
    configType: 'string',
    sourceTables: [
      { table: 'cu_details', column: 'phone' },
      { table: 'ncua_credit_unions', column: 'phone' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'tenant.support.email',
    configType: 'string',
    sourceTables: [
      { table: 'cu_details', column: 'email' },
      { table: 'ncua_credit_unions', column: 'email' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  
  // Tier 2: Design Tokens
  {
    configPath: 'design.color.primary',
    configType: 'string',
    sourceTables: [
      { table: 'cu_branding', column: 'primary_color' },
      { table: 'ncua_credit_unions', column: 'primary_color' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  {
    configPath: 'design.logo.primary',
    configType: 'string',
    sourceTables: [
      { table: 'cu_logos', column: 'logo_url_primary' },
      { table: 'ncua_credit_unions', column: 'logo_url' },
    ],
    mappingType: 'direct',
    confidence: 'high',
  },
  
  // Tier 3: Feature Flags
  {
    configPath: 'features.mobile_deposit',
    configType: 'boolean',
    sourceTables: [
      { table: 'cu_feature_flags', column: 'is_enabled', transform: 'feature_key = mobile_deposit' },
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'nested',
    confidence: 'high',
    notes: 'Query cu_feature_flags where feature_key = "mobile_deposit"',
  },
  
  // Tier 4: IVR
  {
    configPath: 'channels.ivr.enabled',
    configType: 'boolean',
    sourceTables: [
      { table: 'ivr_config', column: 'enabled' },
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'nested',
    confidence: 'medium',
  },
  {
    configPath: 'channels.ivr.hume.config_id',
    configType: 'string',
    sourceTables: [
      { table: 'ivr_config', column: 'hume_config_id' },
    ],
    mappingType: 'direct',
    confidence: 'medium',
  },
  {
    configPath: 'channels.ivr.twilio.phone_number',
    configType: 'string',
    sourceTables: [
      { table: 'ivr_config', column: 'twilio_phone_number' },
    ],
    mappingType: 'direct',
    confidence: 'medium',
  },
  
  // Tier 5: Products
  {
    configPath: 'products.shares',
    configType: 'ShareProduct[]',
    sourceTables: [
      { table: 'share_products', column: '*' },
    ],
    mappingType: 'array',
    confidence: 'medium',
    notes: 'Transform share_products rows to ShareProduct objects',
  },
  {
    configPath: 'products.loans',
    configType: 'LoanProduct[]',
    sourceTables: [
      { table: 'loan_products', column: '*' },
      { table: 'loans', column: '*', transform: 'aggregate' },
    ],
    mappingType: 'array',
    confidence: 'medium',
  },
  
  // Tier 6: Business Rules
  {
    configPath: 'rules.transfer.internal.daily_limit',
    configType: 'number',
    sourceTables: [
      { table: 'cu_limits', column: 'transfer_daily_limit' },
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'nested',
    confidence: 'medium',
  },
  
  // Tier 7: Fraud & Risk
  {
    configPath: 'fraud.risk_threshold.block',
    configType: 'number',
    sourceTables: [
      { table: 'fraud_config', column: 'block_threshold' },
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'nested',
    confidence: 'low',
    notes: 'Table may not exist, check cu_configs JSONB',
  },
  
  // Tier 8: Compliance
  {
    configPath: 'compliance.fdx.enabled',
    configType: 'boolean',
    sourceTables: [
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'jsonb',
    confidence: 'high',
    notes: 'Extract from cu_configs.config->compliance->fdx->enabled',
  },
  {
    configPath: 'compliance.kyc.provider',
    configType: 'KYCProvider',
    sourceTables: [
      { table: 'kyc_config', column: 'provider' },
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'nested',
    confidence: 'medium',
  },
  
  // Tier 9: Integrations
  {
    configPath: 'integrations.core.provider',
    configType: 'CoreProvider',
    sourceTables: [
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'jsonb',
    confidence: 'high',
    notes: 'Extract from cu_configs.config->integrations->core->provider',
  },
  {
    configPath: 'integrations.core.poweron.mode',
    configType: 'string',
    sourceTables: [
      { table: 'cu_configs', column: 'config' },
    ],
    mappingType: 'jsonb',
    confidence: 'high',
  },
]

/**
 * Analyze a table schema and suggest config mappings
 */
export function analyzeTableForConfigMapping(
  tableName: string,
  columns: TableColumn[]
): ConfigFieldMapping[] {
  const suggestions: ConfigFieldMapping[] = []
  
  // Pattern matching for common table/column names
  const patterns = [
    {
      pattern: /^cu_/,
      basePath: 'tenant',
      confidence: 'high' as const,
    },
    {
      pattern: /_logo/,
      basePath: 'design.logo',
      confidence: 'high' as const,
    },
    {
      pattern: /_color/,
      basePath: 'design.color',
      confidence: 'high' as const,
    },
    {
      pattern: /feature/,
      basePath: 'features',
      confidence: 'high' as const,
    },
    {
      pattern: /ivr/,
      basePath: 'channels.ivr',
      confidence: 'medium' as const,
    },
    {
      pattern: /product/,
      basePath: 'products',
      confidence: 'medium' as const,
    },
    {
      pattern: /limit/,
      basePath: 'rules',
      confidence: 'medium' as const,
    },
    {
      pattern: /fraud/,
      basePath: 'fraud',
      confidence: 'low' as const,
    },
    {
      pattern: /compliance/,
      basePath: 'compliance',
      confidence: 'medium' as const,
    },
  ]
  
  for (const { pattern, basePath, confidence } of patterns) {
    if (pattern.test(tableName)) {
      columns.forEach(col => {
        suggestions.push({
          configPath: `${basePath}.${col.columnName}`,
          configType: mapDataTypeToConfigType(col.dataType),
          sourceTables: [
            { table: tableName, column: col.columnName },
          ],
          mappingType: 'direct',
          confidence,
        })
      })
      break
    }
  }
  
  return suggestions
}

function mapDataTypeToConfigType(sqlType: string): string {
  const typeMap: Record<string, string> = {
    'text': 'string',
    'varchar': 'string',
    'uuid': 'string',
    'boolean': 'boolean',
    'integer': 'number',
    'bigint': 'number',
    'numeric': 'number',
    'decimal': 'number',
    'jsonb': 'object',
    'json': 'object',
    'timestamp': 'string',
    'timestamptz': 'string',
    'date': 'string',
  }
  
  return typeMap[sqlType.toLowerCase()] || 'unknown'
}

/**
 * Generate mapping report for all tables
 */
export function generateMappingReport(
  allTables: Array<{ tableName: string; columns: TableColumn[] }>
): {
  highConfidence: ConfigFieldMapping[]
  mediumConfidence: ConfigFieldMapping[]
  lowConfidence: ConfigFieldMapping[]
  unmapped: string[]
} {
  const highConfidence: ConfigFieldMapping[] = []
  const mediumConfidence: ConfigFieldMapping[] = []
  const lowConfidence: ConfigFieldMapping[] = []
  const unmapped: string[] = []
  
  // Start with known mappings
  KNOWN_TABLE_MAPPINGS.forEach(mapping => {
    if (mapping.confidence === 'high') {
      highConfidence.push(mapping)
    } else if (mapping.confidence === 'medium') {
      mediumConfidence.push(mapping)
    } else {
      lowConfidence.push(mapping)
    }
  })
  
  const tablesWithKnownMappings = new Set(
    KNOWN_TABLE_MAPPINGS.flatMap(m => m.sourceTables.map(s => s.table))
  )

  // Analyze each table
  allTables.forEach(({ tableName, columns }) => {
    const suggestions = analyzeTableForConfigMapping(tableName, columns)
    const hasKnownMapping = tablesWithKnownMappings.has(tableName)

    if (suggestions.length === 0 && !hasKnownMapping) {
      unmapped.push(tableName)
    } else if (suggestions.length > 0) {
      suggestions.forEach(suggestion => {
        if (suggestion.confidence === 'high') {
          highConfidence.push(suggestion)
        } else if (suggestion.confidence === 'medium') {
          mediumConfidence.push(suggestion)
        } else {
          lowConfidence.push(suggestion)
        }
      })
    }
  })

  return {
    highConfidence,
    mediumConfidence,
    lowConfidence,
    unmapped,
  }
}
