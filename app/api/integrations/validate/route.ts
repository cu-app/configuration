/**
 * Credential Validation API
 * 
 * Validates credentials before saving to Configuration → Integrations
 * Tests connections to ensure credentials work
 */

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, credentials } = body

    const results: Record<string, any> = {
      valid: false,
      type,
      timestamp: new Date().toISOString(),
    }

    switch (type) {
      case 'poweron_symxchange':
        results.valid = await validateSymXchange(credentials)
        break
      case 'poweron_direct':
        results.valid = await validatePowerOnDirect(credentials)
        break
      case 'hume':
        results.valid = await validateHume(credentials)
        break
      case 'twilio':
        results.valid = await validateTwilio(credentials)
        break
      default:
        return NextResponse.json(
          { error: `Unknown validation type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

async function validateSymXchange(credentials: {
  symxchange_url?: string
  symxchange_api_key?: string
  institution_id?: string
}): Promise<boolean> {
  if (!credentials.symxchange_url || !credentials.symxchange_api_key) {
    return false
  }

  try {
    const response = await fetch(`${credentials.symxchange_url}/health`, {
      headers: {
        'Authorization': `Bearer ${credentials.symxchange_api_key}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

async function validatePowerOnDirect(credentials: {
  poweron_host?: string
  poweron_port?: number
  institution_id?: string
}): Promise<boolean> {
  // Direct PowerOn validation would require actual connection
  // For now, just check that required fields are present
  return !!(credentials.poweron_host && credentials.poweron_port && credentials.institution_id)
}

async function validateHume(credentials: {
  api_key?: string
  project_id?: string
}): Promise<boolean> {
  if (!credentials.api_key) {
    return false
  }

  try {
    const response = await fetch('https://api.hume.ai/v0/evi/configs', {
      headers: {
        'X-Hume-Api-Key': credentials.api_key,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

async function validateTwilio(credentials: {
  account_sid?: string
  auth_token?: string
}): Promise<boolean> {
  if (!credentials.account_sid || !credentials.auth_token) {
    return false
  }

  try {
    const auth = Buffer.from(`${credentials.account_sid}:${credentials.auth_token}`).toString('base64')
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${credentials.account_sid}.json`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}
