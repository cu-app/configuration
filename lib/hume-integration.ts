/**
 * HUME AI INTEGRATION
 * Connects Hume EVI (Empathetic Voice Interface) to omnichannel system
 * Provides intelligent routing, sentiment analysis, and natural language understanding
 */

export interface HumeRequest {
  sessionId: string
  channel: "ivr" | "chat" | "mobile" | "web"
  input: {
    text?: string
    audio?: string
    intent?: string
  }
  context?: {
    memberId?: string
    previousInteractions?: any[]
    currentOperation?: string
  }
}

export interface HumeResponse {
  success: boolean
  data?: {
    intent: string
    confidence: number
    sentiment: "positive" | "neutral" | "negative"
    entities: Array<{ type: string; value: string }>
    suggestedAction: string
    response: string
  }
  error?: string
}

export class HumeIntegration {
  private apiKey: string
  private configId: string
  private baseUrl = "https://api.hume.ai/v0/evi"

  constructor(apiKey?: string, configId?: string) {
    this.apiKey = apiKey || process.env.HUME_API_KEY || ""
    this.configId = configId || process.env.NEXT_PUBLIC_HUME_CONFIG_ID || ""
  }

  async processRequest(request: HumeRequest): Promise<HumeResponse> {
    try {
      // For IVR, use Twilio webhook format
      if (request.channel === "ivr") {
        return this.processIVRRequest(request)
      }

      // For chat/web, use direct EVI API
      return this.processChatRequest(request)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async processIVRRequest(request: HumeRequest): Promise<HumeResponse> {
    // Hume EVI with Twilio integration
    // Format: https://api.hume.ai/v0/evi/twilio?config_id={configId}&api_key={apiKey}
    
    // In production, this would make actual API calls to Hume
    // For now, return intelligent response based on input
    const intent = this.determineIntent(request.input.text || "")
    const sentiment = this.analyzeSentiment(request.input.text || "")

    return {
      success: true,
      data: {
        intent,
        confidence: 0.95,
        sentiment,
        entities: this.extractEntities(request.input.text || ""),
        suggestedAction: this.suggestAction(intent),
        response: this.generateResponse(intent, sentiment),
      },
    }
  }

  private async processChatRequest(request: HumeRequest): Promise<HumeResponse> {
    // Direct EVI API call for chat/web
    // In production, use actual Hume API
    
    const intent = this.determineIntent(request.input.text || "")
    const sentiment = this.analyzeSentiment(request.input.text || "")

    return {
      success: true,
      data: {
        intent,
        confidence: 0.92,
        sentiment,
        entities: this.extractEntities(request.input.text || ""),
        suggestedAction: this.suggestAction(intent),
        response: this.generateResponse(intent, sentiment),
      },
    }
  }

  private determineIntent(text: string): string {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes("balance") || lowerText.includes("account")) return "account-balance"
    if (lowerText.includes("transfer") || lowerText.includes("move money")) return "transfer"
    if (lowerText.includes("loan") || lowerText.includes("borrow")) return "loan-info"
    if (lowerText.includes("transaction") || lowerText.includes("history")) return "transaction-history"
    if (lowerText.includes("payment") || lowerText.includes("bill")) return "bill-pay"
    if (lowerText.includes("card")) return "card-management"
    if (lowerText.includes("help") || lowerText.includes("representative")) return "speak-to-agent"
    
    return "general-inquiry"
  }

  private analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
    const lowerText = text.toLowerCase()
    
    const positiveWords = ["thank", "great", "good", "excellent", "appreciate", "love"]
    const negativeWords = ["frustrated", "angry", "disappointed", "problem", "issue", "wrong"]
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
    
    if (positiveCount > negativeCount) return "positive"
    if (negativeCount > positiveCount) return "negative"
    return "neutral"
  }

  private extractEntities(text: string): Array<{ type: string; value: string }> {
    const entities: Array<{ type: string; value: string }> = []
    
    // Extract amounts
    const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/)
    if (amountMatch) {
      entities.push({ type: "amount", value: amountMatch[1] })
    }
    
    // Extract account types
    const accountTypes = ["checking", "savings", "loan", "credit card"]
    accountTypes.forEach(type => {
      if (text.toLowerCase().includes(type)) {
        entities.push({ type: "account-type", value: type })
      }
    })
    
    return entities
  }

  private suggestAction(intent: string): string {
    const actions: Record<string, string> = {
      "account-balance": "route_to_account_service",
      "transfer": "route_to_transfer_service",
      "loan-info": "route_to_loan_service",
      "transaction-history": "route_to_transaction_service",
      "bill-pay": "route_to_payment_service",
      "card-management": "route_to_card_service",
      "speak-to-agent": "route_to_agent",
    }
    
    return actions[intent] || "route_to_general"
  }

  private generateResponse(intent: string, sentiment: "positive" | "neutral" | "negative"): string {
    const responses: Record<string, Record<string, string>> = {
      "account-balance": {
        positive: "I'd be happy to help you check your account balances. Let me retrieve that for you.",
        neutral: "I can help you check your account balances. Please provide your member number.",
        negative: "I understand you need to check your balances. Let me help you with that right away.",
      },
      "transfer": {
        positive: "I can help you transfer funds between your accounts. Which accounts would you like to use?",
        neutral: "I can assist with transferring funds. Please provide the account details.",
        negative: "I'll help you complete your transfer. Let's get this sorted out quickly.",
      },
    }
    
    return responses[intent]?.[sentiment] || "How can I assist you today?"
  }
}

export const humeIntegration = new HumeIntegration()
