"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Sparkles, Copy, Check, Send } from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface OutreachEmailGeneratorProps {
  cu: CreditUnionData
}

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
  tags: string[]
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "core-modernization",
    name: "Core Modernization",
    subject: "{{displayName}} + CU.APP: Beyond {{coreBanking.provider}}",
    body: `Dear {{ceo}},

{{displayName}} has {{membersFormatted}} members trusting you with {{assetsFormatted}} in assets. Your current {{coreBanking.provider}} ({{coreBanking.platform}}) infrastructure serves them—but at what cost?

Since {{founded}}, you've built something remarkable in {{city}}, {{state}}. The question isn't whether your members deserve better digital experiences. It's whether you'll build it, buy it, or get left behind.

CU.APP offers:
- 380+ pre-built database tables (yours took years)
- Config-over-code: one JSON powers mobile + web
- Open source core, paid adapters when you need them
- No vendor lock-in. Ever.

Your {{coreBanking.confidence}}% confidence in {{coreBanking.provider}} came from {{coreBanking.source}}. We can work alongside it or replace it entirely.

15 minutes. That's all I'm asking.

—Kyle`,
    tags: ["core-banking", "modernization", "enterprise"]
  },
  {
    id: "app-store-pain",
    name: "App Store Reviews",
    subject: "{{displayName}}'s mobile app: {{appStoreId ? 'we found it' : 'we can build it'}}",
    body: `{{ceo}},

I pulled {{displayName}}'s App Store data. {{appStoreId ? 'Your members are talking.' : 'You don\\'t have a native app yet.'}}

{{membersFormatted}} members. {{assetsFormatted}} in assets. {{founded}} founding year. You've earned trust the hard way.

But mobile banking isn't optional anymore. Your members compare you to Chase, not the CU down the street.

CU.APP: production-ready Flutter app. Your brand. Your config. Ships in weeks, not years.

$15K one-time + $500/mo. That's less than one FTE.

Reply "demo" and I'll spin up a branded preview of {{displayName}}'s app.

—Kyle`,
    tags: ["mobile", "app-store", "quick-pitch"]
  },
  {
    id: "network-effect",
    name: "Network Invitation",
    subject: "4,300 CUs. One network. {{displayName}}'s seat is open.",
    body: `{{ceo}},

{{displayName}} ranks #{{rank}} by assets. {{assetsFormatted}}. {{membersFormatted}} members.

Every fraudster you catch, the network learns. Every feature one CU builds, everyone gets. Every compliance playbook, shared.

Traditional vendors isolate you. We connect you.

Open source core. Paid adapters. Your data stays yours.

{{coreBanking.provider}} isn't going anywhere—but your members expect Venmo-quality UX. We can layer on top.

First 50 CUs get founding member pricing. Reply for details.

—Kyle`,
    tags: ["network", "fraud", "collective"]
  },
  {
    id: "founder-story",
    name: "Founder Direct",
    subject: "I got fired. Then I built this. {{displayName}} might want it.",
    body: `{{ceo}},

August 25th, 2024. Same day Linux launched 34 years prior. I got fired from a top-10 CU.

So I built what I wished existed: an open source digital banking platform. 380 tables. 48 Flutter screens. PowerOn integration. ISO 20022. The whole stack.

{{displayName}} has {{assetsFormatted}} in assets and {{membersFormatted}} members counting on you. You're running {{coreBanking.provider}}. I know the pain.

This isn't a sales pitch. It's an invitation to look at the code.

github.com/cuapp (or I'll send a private link)

If it's useful, use it. If not, you're out nothing.

—Kyle
(Former Enterprise Architect, now building in public)`,
    tags: ["founder", "story", "open-source"]
  }
]

function interpolate(template: string, cu: CreditUnionData): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const parts = path.trim().split(".")
    let value: unknown = cu
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return `[${path}]`
      }
    }
    return String(value ?? `[${path}]`)
  })
}

export function OutreachEmailGenerator({ cu }: OutreachEmailGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(EMAIL_TEMPLATES[0].id)
  const [generatedEmail, setGeneratedEmail] = useState<string>("")
  const [generatedSubject, setGeneratedSubject] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)!

  const generateEmail = async () => {
    setIsGenerating(true)

    // Interpolate template with CU data
    const subject = interpolate(template.subject, cu)
    const body = interpolate(template.body, cu)

    // Simulate AI enhancement delay (replace with actual AI call)
    await new Promise(r => setTimeout(r, 800))

    setGeneratedSubject(subject)
    setGeneratedEmail(body)
    setIsGenerating(false)
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(`Subject: ${generatedSubject}\n\n${generatedEmail}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openMailClient = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(generatedEmail)}`
    window.open(mailtoUrl, "_blank")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="w-4 h-4" />
          Outreach Generator
          <Badge variant="outline" className="ml-auto text-xs">
            {cu.displayName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_TEMPLATES.map(t => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-2">
                  {t.name}
                  <span className="text-xs text-muted-foreground">
                    {t.tags.map(tag => `#${tag}`).join(" ")}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>Maps:</strong> {cu.displayName} • {cu.assetsFormatted} • {cu.membersFormatted} members</div>
          <div><strong>Core:</strong> {cu.coreBanking.provider} ({cu.coreBanking.confidence}% confidence)</div>
          <div><strong>CEO:</strong> {cu.ceo} • <strong>Founded:</strong> {cu.founded}</div>
        </div>

        <Button
          onClick={generateEmail}
          disabled={isGenerating}
          className="w-full h-8 text-sm"
          size="sm"
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              <Sparkles className="w-3 h-3 mr-1" />
              Generate Personalized Email
            </>
          )}
        </Button>

        {generatedEmail && (
          <>
            <div className="text-xs font-medium">Subject: {generatedSubject}</div>
            <Textarea
              value={generatedEmail}
              onChange={(e) => setGeneratedEmail(e.target.value)}
              className="min-h-[200px] text-xs font-mono"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyToClipboard} className="flex-1 h-7 text-xs">
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" onClick={openMailClient} className="flex-1 h-7 text-xs">
                <Send className="w-3 h-3 mr-1" />
                Open Mail
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
