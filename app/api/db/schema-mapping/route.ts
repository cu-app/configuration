import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Map Supabase tables to CU Configuration fields
 *
 * Queries known tables by sampling; for full 712-table mapping POST schema dump.
 */

interface ConfigMapping {
  configPath: string
  configType: string
  tables: Array<{
    tableName: string
    columnName: string
    dataType: string
    mappingType: "direct" | "nested" | "array" | "computed"
    notes?: string
  }>
  confidence: "high" | "medium" | "low"
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get list of all tables from public schema
    const knownTables = [
      // Core CU tables
      'ncua_credit_unions',
      'cu_configs',
      'cu_logos',
      'cu_branches',
      'cu_feature_flags',
      'cu_api_endpoints',
      'cu_branding',
      'cu_details',
      
      // Member/Account tables
      'members',
      'accounts',
      'transactions',
      'loans',
      'loan_applications',
      'loan_payments',
      'cards',
      'card_transactions',
      
      // Payment tables
      'ach_transfers',
      'wire_transfers',
      'transfers',
      'payments',
      'payment_rails',
      'settlements',
      
      // Compliance tables
      'compliance_checks',
      'fraud_alerts',
      'audit_logs',
      'kyc_verifications',
      'ofac_checks',
      
      // IVR tables
      'ivr_calls',
      'ivr_sessions',
      'ivr_transcripts',
      
      // Marketing/CMS tables
      'cms_pages',
      'cms_media',
      
      // Feature packages
      'feature_packages',

      // Other common tables
      'domains',
      'branding',
      'features',
      'api_endpoints',
    ]

    const tableColumnMap: Record<string, string[]> = {}

    // Sample each table to get columns
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (!error && data && data.length > 0) {
          tableColumnMap[tableName] = Object.keys(data[0])
        }
      } catch {
        // Table might not exist, skip
        continue
      }
    }

    // Map to configuration structure
    const configStructure = {
      // Tier 1: Identity & Brand
      tenant: {
        id: ['cu_configs.tenant_id', 'ncua_credit_unions.cu_number'],
        name: ['ncua_credit_unions.cu_name', 'cu_details.name'],
        charter_number: ['ncua_credit_unions.charter_number', 'cu_details.charter_number'],
        domain: ['domains.domain_name'],
        support: {
          phone: ['cu_details.phone', 'ncua_credit_unions.phone'],
          email: ['cu_details.email', 'ncua_credit_unions.email'],
        },
        legal: {
          name: ['ncua_credit_unions.cu_name'],
          routing: ['cu_details.routing_number'],
        },
      },
      
      // Tier 2: Design Tokens
      design: {
        color: {
          primary: ['cu_branding.primary_color', 'ncua_credit_unions.primary_color'],
        },
        logo: {
          primary: ['cu_logos.logo_url_primary', 'ncua_credit_unions.logo_url'],
        },
      },
      
      // Tier 3: Feature Flags
      features: {
        mobile_deposit: ['cu_feature_flags.feature_key = mobile_deposit'],
        bill_pay: ['cu_feature_flags.feature_key = bill_pay'],
        // ... map all feature flags
      },
      
      // Tier 4: IVR
      channels: {
        ivr: {
          enabled: ['ivr_config.enabled'],
          hume: {
            config_id: ['ivr_config.hume_config_id'],
          },
          twilio: {
            phone_number: ['ivr_config.twilio_phone_number'],
          },
        },
      },
      
      // Tier 5: Products
      products: {
        shares: ['share_products'],
        loans: ['loan_products', 'loans'],
        cards: ['cards', 'card_products'],
      },
      
      // Tier 6: Business Rules
      rules: {
        transfer: {
          internal: {
            daily_limit: ['cu_limits.transfer_daily_limit'],
          },
        },
      },
      
      // Tier 7: Fraud & Risk
      fraud: {
        risk_threshold: {
          block: ['fraud_config.block_threshold'],
        },
      },
      
      // Tier 8: Compliance
      compliance: {
        fdx: {
          enabled: ['cu_configs.config->compliance->fdx->enabled'],
          version: ['cu_configs.config->compliance->fdx->version'],
        },
        kyc: {
          provider: ['kyc_config.provider'],
        },
      },
      
      // Tier 9: Integrations
      integrations: {
        core: {
          provider: ['cu_configs.config->integrations->core->provider'],
          poweron: {
            mode: ['cu_configs.config->integrations->core->poweron->mode'],
            symxchange_url: ['cu_configs.config->integrations->core->poweron->symxchange_url'],
          },
        },
      },
    }

    // Build mappings
    function buildMappings(obj: Record<string, unknown>, path = ""): ConfigMapping[] {
      const results: ConfigMapping[] = []
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        
        if (Array.isArray(value)) {
          // This is a mapping array
          const tables: ConfigMapping["tables"] = (value as string[]).map((mapping) => {
            const [table, column] = mapping.split('.')
            return {
              tableName: table,
              columnName: column || '*',
              dataType: 'unknown',
              mappingType: 'direct',
            }
          })
          
          results.push({
            configPath: currentPath,
            configType: 'string | number | boolean',
            tables,
            confidence: 'high',
          })
        } else if (typeof value === "object" && value !== null) {
          // Nested object, recurse
          results.push(...buildMappings(value as Record<string, unknown>, currentPath))
        }
      }
      
      return results
    }

    const allMappings = buildMappings(configStructure)

    // Analyze actual tables
    const tableAnalysis = Object.entries(tableColumnMap).map(([tableName, columns]) => {
      return {
        tableName,
        columnCount: columns.length,
        columns: columns.slice(0, 10), // First 10 columns
        mappableToConfig: allMappings.filter(m => 
          m.tables.some(t => t.tableName === tableName)
        ).length > 0,
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalTablesAnalyzed: Object.keys(tableColumnMap).length,
        totalMappings: allMappings.length,
        tablesWithMappings: new Set(
          allMappings.flatMap(m => m.tables.map(t => t.tableName))
        ).size,
      },
      mappings: allMappings.slice(0, 50), // First 50 mappings
      tableAnalysis: tableAnalysis.slice(0, 50), // First 50 tables
      recommendations: {
        highPriority: [
          'cu_configs - Main configuration table',
          'ncua_credit_unions - CU master data',
          'cu_logos - Logo storage',
          'cu_feature_flags - Feature toggles',
        ],
        needsMapping: [
          'Map all 712 tables to config structure',
          'Identify which tables are CU-specific vs system-wide',
          'Create migration path from tables to config JSON',
        ],
      },
      note: 'This is a sample mapping. To map all 712 tables, run full schema introspection.',
    })
  } catch (error) {
    console.error('[Schema Mapping] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to map schema',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Use Supabase SQL editor to query information_schema directly',
      },
      { status: 500 }
    )
  }
}

/** Schema row format from information_schema.columns (exported from SQL Editor) */
interface SchemaRow {
  table_schema: string
  table_name: string
  column_name: string
  data_type: string
  is_nullable?: string
  column_default?: string | null
  ordinal_position?: number
}

/**
 * POST: Accept full schema dump from information_schema and return complete mapping report.
 * Body: { schema: SchemaRow[] } where schema is the result of the SQL query below.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const schemaRows = body.schema as SchemaRow[] | undefined

    if (!Array.isArray(schemaRows) || schemaRows.length === 0) {
      return NextResponse.json({
        message: 'Full schema introspection requires schema dump',
        sqlQuery: `
          SELECT 
            table_schema,
            table_name,
            column_name,
            data_type,
            is_nullable,
            column_default,
            ordinal_position
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `,
        instructions: [
          '1. Run the SQL query above in Supabase SQL Editor',
          '2. Export results as JSON',
          '3. POST to this endpoint with body: { "schema": <array of rows> }',
          '4. Response will include full mapping report for all tables',
        ],
      })
    }

    // Group by table_name and convert to mapper format
    const tableColumns = new Map<string, Array<{ tableName: string; columnName: string; dataType: string; isNullable: boolean; defaultValue: string | null }>>()
    for (const row of schemaRows) {
      const t = row.table_name
      if (!tableColumns.has(t)) {
        tableColumns.set(t, [])
      }
      const cols = tableColumns.get(t)
      if (cols) {
        cols.push({
        tableName: t,
        columnName: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === 'YES',
        defaultValue: row.column_default ?? null,
        })
      }
    }

    const allTables = Array.from(tableColumns.entries()).map(([tableName, cols]) => ({
      tableName,
      columns: cols.map(c => ({
        tableName: c.tableName,
        columnName: c.columnName,
        dataType: c.dataType,
        isNullable: c.isNullable,
        defaultValue: c.defaultValue,
      })),
    }))

    const { generateMappingReport } = await import('@/lib/schema-to-config-mapper')
    const report = generateMappingReport(allTables)

    const totalTables = allTables.length
    const mappedCount = totalTables - report.unmapped.length

    return NextResponse.json({
      success: true,
      summary: {
        totalTablesAnalyzed: totalTables,
        mappedTables: mappedCount,
        unmappedTables: report.unmapped.length,
        highConfidenceMappings: report.highConfidence.length,
        mediumConfidenceMappings: report.mediumConfidence.length,
        lowConfidenceMappings: report.lowConfidence.length,
      },
      mappings: {
        highConfidence: report.highConfidence,
        mediumConfidence: report.mediumConfidence,
        lowConfidence: report.lowConfidence,
      },
      unmapped: report.unmapped,
      recommendations: [
        ...(report.unmapped.length > 0
          ? [`${report.unmapped.length} tables have no config mapping; review for operational vs. config use.`]
          : []),
        'Use lib/config-from-database.ts to generate CreditUnionConfig from Supabase using these mappings.',
      ],
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process schema query',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
