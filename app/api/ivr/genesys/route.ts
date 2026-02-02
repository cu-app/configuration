import { NextResponse } from "next/server"
import { createVoiceResponse } from "@/lib/twiml"
import { loadCredentialsFromConfig, getPowerOnConfig } from "@/lib/config-credentials"
import { PowerOnService } from "@/lib/poweron-service"

/**
 * GENESYS IVR INTEGRATION
 * Connects Genesys IVR to core banking adapters via omnichannel service
 * Routes through all 21 layers of architecture
 */

interface GenesysIVRRequest {
  UCID: string // Unique Call Identifier
  memberId?: string
  operation: string
  digits?: string
  speechResult?: string
  payload?: any
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const UCID = formData.get("UCID")?.toString() || ""
    const digits = formData.get("Digits")?.toString() || ""
    const speechResult = formData.get("SpeechResult")?.toString() || ""
    const memberId = formData.get("MemberId")?.toString()

    const twiml = createVoiceResponse()
    const voiceConfig = { voice: "Polly.Joanna-Neural", language: "en-US" }

    // Route through omnichannel service
    const operation = determineOperation(digits, speechResult)
    
    if (operation === "balance" && memberId) {
      // Process balance inquiry through all layers
      const result = await processOmnichannelRequest({
        channel: "ivr",
        operation: "account-balance",
        memberId,
        sessionId: UCID,
        payload: { digits, speechResult },
      })

      if (result.success && result.data) {
        const balances = result.data.balances || []
        const balanceText = balances
          .map((b: any) => `Your ${b.accountType} account balance is $${b.balance.toFixed(2)}`)
          .join(". ")

        twiml.say(`Thank you. ${balanceText}`, voiceConfig)
        twiml.gather({ numDigits: 1, action: "/api/ivr/post-balance", method: "POST", timeout: 5 }, (g) => {
          g.say("To hear recent transactions, press 1. To transfer funds, press 2. To return to the main menu, press star.", voiceConfig)
        })
      } else {
        twiml.say("I'm sorry, I couldn't retrieve your account balances. Please try again or press 0 to speak with a representative.", voiceConfig)
        twiml.redirect("/api/ivr/menu")
      }
    } else if (operation === "transfer" && memberId) {
      // Process transfer through all layers
      twiml.say("Please enter the account number you'd like to transfer from, followed by the pound sign.", voiceConfig)
      twiml.gather({ numDigits: 4, action: "/api/ivr/transfer", method: "POST", finishOnKey: "#" })
    } else {
      // Default menu
      twiml.gather({
        numDigits: 1,
        action: "/api/ivr/menu",
        method: "POST",
        timeout: 5,
        speechTimeout: "auto",
        input: ["dtmf", "speech"],
      }, (g) => {
        g.say(
          "Thank you for calling. For account balances, press 1 or say balances. " +
          "For transfers, press 2 or say transfer. " +
          "For loan information, press 3 or say loans. " +
          "To speak with a representative, press 0 or say representative.",
          voiceConfig
        )
      })
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("Genesys IVR error:", error)
    const twiml = createVoiceResponse()
    twiml.say("I'm sorry, there was an error processing your request. Please try again or press 0 to speak with a representative.", {
      voice: "Polly.Joanna-Neural",
      language: "en-US",
    })
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

function determineOperation(digits: string, speechResult: string): string {
  if (digits === "1" || speechResult?.toLowerCase().includes("balance")) return "balance"
  if (digits === "2" || speechResult?.toLowerCase().includes("transfer")) return "transfer"
  if (digits === "3" || speechResult?.toLowerCase().includes("loan")) return "loan"
  return "menu"
}

async function processOmnichannelRequest(request: {
  channel: string
  operation: string
  memberId?: string
  sessionId?: string
  payload: any
  tenantPrefix?: string
  cuId?: string
}): Promise<any> {
  try {
    // Load credentials from config if tenant info provided
    let powerOnConfig: any = {}
    if (request.tenantPrefix || request.cuId) {
      try {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const tenantId = request.cuId || request.tenantPrefix
        const credentials = await loadCredentialsFromConfig(tenantId || '', supabase)
        powerOnConfig = getPowerOnConfig(credentials, request.tenantPrefix, request.cuId)
      } catch (error) {
        console.warn('[IVR] Could not load config, using defaults:', error)
      }
    }

    // Use PowerOn service directly for balance inquiries
    if (request.operation === "account-balance" && request.memberId) {
      const powerOn = new PowerOnService(powerOnConfig)
      await powerOn.connect()
      
      const accounts = await powerOn.getAccounts(request.memberId)
      if (accounts.success && accounts.data) {
        return {
          success: true,
          data: {
            balances: accounts.data.map((acc: any) => ({
              accountType: acc.type || 'Unknown',
              balance: acc.balance || 0,
              accountNumber: acc.accountNumber,
            })),
          },
        }
      }
    }

    // Fall back to omnichannel API for other operations
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/omnichannel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Omnichannel request error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
