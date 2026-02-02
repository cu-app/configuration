/**
 * OMNICHANNEL SERVICE
 * Unified service for routing requests across all channels
 * Connects IVR, Mobile, Web, Chat to core banking systems
 */

import type { CreditUnionData } from "./credit-union-data"

export interface ChannelRequest {
  channel: "ivr" | "mobile" | "web" | "chat" | "email" | "sms" | "push"
  operation: string
  memberId?: string
  sessionId?: string
  payload: any
}

export interface ChannelResponse {
  success: boolean
  data?: any
  error?: string
  metadata: {
    channel: string
    operation: string
    layers: string[]
    processingTime: number
    coreSystem: string
  }
}

export class OmnichannelService {
  private baseUrl: string

  constructor(baseUrl: string = "/api/omnichannel") {
    this.baseUrl = baseUrl
  }

  async processRequest(request: ChannelRequest): Promise<ChannelResponse> {
    try {
      const response = await fetch(this.baseUrl, {
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
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          channel: request.channel,
          operation: request.operation,
          layers: [],
          processingTime: 0,
          coreSystem: "unknown",
        },
      }
    }
  }

  // IVR Operations
  async ivrBalanceInquiry(memberId: string, pin: string): Promise<ChannelResponse> {
    return this.processRequest({
      channel: "ivr",
      operation: "account-balance",
      memberId,
      payload: { pin },
    })
  }

  async ivrTransfer(memberId: string, from: string, to: string, amount: number): Promise<ChannelResponse> {
    return this.processRequest({
      channel: "ivr",
      operation: "transfer",
      memberId,
      payload: { from, to, amount },
    })
  }

  // Mobile Operations
  async mobileGetAccounts(memberId: string): Promise<ChannelResponse> {
    return this.processRequest({
      channel: "mobile",
      operation: "account-balance",
      memberId,
      payload: {},
    })
  }

  async mobileTransfer(memberId: string, from: string, to: string, amount: number): Promise<ChannelResponse> {
    return this.processRequest({
      channel: "mobile",
      operation: "transfer",
      memberId,
      payload: { from, to, amount },
    })
  }

  // Web Operations
  async webGetAccounts(memberId: string): Promise<ChannelResponse> {
    return this.processRequest({
      channel: "web",
      operation: "account-balance",
      memberId,
      payload: {},
    })
  }

  // Chat Operations (with Hume AI)
  async chatInquiry(sessionId: string, message: string): Promise<ChannelResponse> {
    return this.processRequest({
      channel: "chat",
      operation: "natural-language-query",
      sessionId,
      payload: { message },
    })
  }
}

export const omnichannelService = new OmnichannelService()
