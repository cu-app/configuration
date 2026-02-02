"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  "How do I claim my credit union?",
  "What is the IVR configuration?",
  "How do I add branch locations?",
  "Can I customize the mobile app?",
  "How do I set up member authentication?",
]

export function AIAssistant({ tenantName }: { tenantName?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: tenantName
        ? `Hi! I'm your CU.APP assistant. I'm here to help ${tenantName} get the most out of your configuration. What would you like to know?`
        : "Hi! I'm your CU.APP assistant. I can help you claim your credit union, configure your mobile app, set up IVR, and much more. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response - in production, this would call your AI endpoint
    setTimeout(() => {
      const responses: Record<string, string> = {
        claim: `To claim your credit union:\n\n1. Click "Claim Your Credit Union" in the header\n2. Search for your CU by name or charter number\n3. Enter your work email (must match your CU's domain)\n4. We'll send a verification link\n5. Once verified, you'll have full admin access!\n\nNeed help finding your CU? Just type its name and I can look it up.`,
        ivr: `IVR (Interactive Voice Response) configuration lets you customize your phone banking system:\n\n• **Voice Settings**: Choose voice type, language, speaking rate\n• **Prompts**: Customize greeting, menu options, hold music\n• **Routing**: Set up call flows and escalation rules\n• **Hours**: Configure business hours and after-hours handling\n\nGo to Configuration → IVR & Voice to get started.`,
        branch: `To add branch locations:\n\n1. Go to Configuration → Branches\n2. Click "Discover Branches" to auto-find via Google\n3. Review and verify each location\n4. Add photos and hours for each branch\n5. Branches sync to your mobile app automatically!\n\nI can also help you verify your headquarters address.`,
        app: `You can fully customize your mobile app:\n\n• **Branding**: Logo, colors, fonts\n• **Features**: Enable/disable sections\n• **Navigation**: Customize menu structure\n• **Content**: Update all text and images\n\nUse the App Preview to see changes in real-time!`,
        auth: `Member authentication options:\n\n• **Username/Password**: Traditional login\n• **Biometrics**: Face ID, Touch ID\n• **SSO**: Single sign-on integration\n• **MFA**: Multi-factor authentication\n\nConfigure these in Configuration → Security.`,
      }

      let response =
        "I'd be happy to help with that! Could you tell me more about what you're trying to accomplish? I can assist with claiming your credit union, configuring IVR, setting up branches, customizing your app, and much more."

      const lowerInput = userMessage.content.toLowerCase()
      if (lowerInput.includes("claim")) response = responses.claim
      else if (lowerInput.includes("ivr") || lowerInput.includes("voice") || lowerInput.includes("phone"))
        response = responses.ivr
      else if (lowerInput.includes("branch") || lowerInput.includes("location")) response = responses.branch
      else if (lowerInput.includes("app") || lowerInput.includes("mobile") || lowerInput.includes("custom"))
        response = responses.app
      else if (lowerInput.includes("auth") || lowerInput.includes("login") || lowerInput.includes("member"))
        response = responses.auth

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ])
      setIsLoading(false)
    }, 1000)
  }

  function handleSuggestion(question: string) {
    setInput(question)
  }

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-all",
          "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
          isOpen && "scale-0 opacity-0",
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-background border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300",
          isOpen ? "opacity-100 scale-100 h-[600px] max-h-[80vh]" : "opacity-0 scale-95 h-0 pointer-events-none",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">CU.APP Assistant</h3>
              <p className="text-xs text-white/70">Always here to help</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  message.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-muted rounded-bl-md",
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="text-xs bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-full"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
