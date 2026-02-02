/**
 * Lightweight TwiML builder - replaces the heavy twilio SDK
 * TwiML is just XML, so we build it with string templates
 */

interface SayOptions {
  voice?: string
  language?: string
}

interface GatherOptions {
  numDigits?: number
  action?: string
  method?: string
  timeout?: number
  speechTimeout?: string
  input?: string[]
  finishOnKey?: string
}

class VoiceResponseBuilder {
  private content: string[] = []

  say(text: string, options: SayOptions = {}): this {
    const voice = options.voice || 'Polly.Joanna-Neural'
    const language = options.language || 'en-US'
    this.content.push(`<Say voice="${voice}" language="${language}">${this.escapeXml(text)}</Say>`)
    return this
  }

  gather(options: GatherOptions, innerContent?: (builder: VoiceResponseBuilder) => void): this {
    const attrs: string[] = []
    if (options.numDigits) attrs.push(`numDigits="${options.numDigits}"`)
    if (options.action) attrs.push(`action="${options.action}"`)
    if (options.method) attrs.push(`method="${options.method}"`)
    if (options.timeout) attrs.push(`timeout="${options.timeout}"`)
    if (options.speechTimeout) attrs.push(`speechTimeout="${options.speechTimeout}"`)
    if (options.input) attrs.push(`input="${options.input.join(' ')}"`)
    if (options.finishOnKey) attrs.push(`finishOnKey="${options.finishOnKey}"`)

    if (innerContent) {
      const innerBuilder = new VoiceResponseBuilder()
      innerContent(innerBuilder)
      this.content.push(`<Gather ${attrs.join(' ')}>${innerBuilder.getContent()}</Gather>`)
    } else {
      this.content.push(`<Gather ${attrs.join(' ')} />`)
    }
    return this
  }

  redirect(url: string, method: string = 'POST'): this {
    this.content.push(`<Redirect method="${method}">${url}</Redirect>`)
    return this
  }

  dial(number: string, options: { callerId?: string; timeout?: number } = {}): this {
    const attrs: string[] = []
    if (options.callerId) attrs.push(`callerId="${options.callerId}"`)
    if (options.timeout) attrs.push(`timeout="${options.timeout}"`)
    this.content.push(`<Dial ${attrs.join(' ')}>${number}</Dial>`)
    return this
  }

  hangup(): this {
    this.content.push('<Hangup />')
    return this
  }

  pause(length: number = 1): this {
    this.content.push(`<Pause length="${length}" />`)
    return this
  }

  play(url: string, options: { loop?: number } = {}): this {
    if (options.loop) {
      this.content.push(`<Play loop="${options.loop}">${url}</Play>`)
    } else {
      this.content.push(`<Play>${url}</Play>`)
    }
    return this
  }

  record(options: { action?: string; maxLength?: number; playBeep?: boolean } = {}): this {
    const attrs: string[] = []
    if (options.action) attrs.push(`action="${options.action}"`)
    if (options.maxLength) attrs.push(`maxLength="${options.maxLength}"`)
    if (options.playBeep !== undefined) attrs.push(`playBeep="${options.playBeep}"`)
    this.content.push(`<Record ${attrs.join(' ')} />`)
    return this
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  getContent(): string {
    return this.content.join('\n')
  }

  toString(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${this.content.join('\n')}
</Response>`
  }
}

export function createVoiceResponse(): VoiceResponseBuilder {
  return new VoiceResponseBuilder()
}

export { VoiceResponseBuilder }
