"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, MessageSquare, Shield, Ban, Flag, UserCheck, Pencil, Plus, X, Info, Eye, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RuleAction } from "./rule-canvas"

interface ActionPanelProps {
  action: RuleAction
  onUpdate: (action: RuleAction) => void
  onDelete: () => void
}

// Action types with descriptions
const ACTION_TYPES = [
  {
    value: "notify_member",
    label: "Send notification",
    icon: Bell,
    description: "Send a push notification, SMS, or email to the member",
    helpText: "Let the member know something happened. Great for alerts, confirmations, or reminders.",
    params: [
      {
        key: "channel",
        label: "Notification method",
        type: "select",
        options: [
          { value: "push", label: "Push notification", description: "Appears on their phone instantly" },
          { value: "sms", label: "Text message (SMS)", description: "Sent to their phone number" },
          { value: "email", label: "Email", description: "Sent to their email address" },
        ],
        helpText: "How should we reach the member?",
      },
      {
        key: "template",
        label: "Message template",
        type: "select",
        options: [
          { value: "large_transfer_alert", label: "Large transfer alert" },
          { value: "fraud_warning", label: "Fraud warning" },
          { value: "payment_reminder", label: "Payment reminder" },
          { value: "balance_low", label: "Low balance warning" },
          { value: "custom", label: "Custom message" },
        ],
        helpText: "Pick a pre-written message or create your own",
      },
    ],
  },
  {
    value: "show_alert",
    label: "Show alert",
    icon: MessageSquare,
    description: "Display a popup message in the app",
    helpText: "Show an important message that the member must acknowledge before continuing.",
    params: [
      {
        key: "type",
        label: "Alert style",
        type: "select",
        options: [
          { value: "info", label: "Information (blue)", description: "Helpful tips or updates" },
          { value: "warning", label: "Warning (yellow)", description: "Something they should know" },
          { value: "error", label: "Error (red)", description: "Something went wrong" },
          { value: "success", label: "Success (green)", description: "Good news!" },
        ],
        helpText: "The color and icon style for this alert",
      },
      {
        key: "title",
        label: "Alert title",
        type: "text",
        helpText: "A short headline (keep it under 50 characters)",
      },
      {
        key: "message",
        label: "Alert message",
        type: "textarea",
        helpText: "The full message to display. Be clear and helpful.",
      },
      {
        key: "confirmRequired",
        label: "Require confirmation",
        type: "boolean",
        helpText: "Must they click a button to dismiss this alert?",
      },
    ],
  },
  {
    value: "deny_transaction",
    label: "Block transaction",
    icon: Ban,
    description: "Stop this transaction from going through",
    helpText: "Use this carefully! This completely blocks the transaction. Make sure to show a helpful error message.",
    params: [
      {
        key: "reason",
        label: "Reason code",
        type: "select",
        options: [
          { value: "ACCOUNT_RESTRICTED", label: "Account restricted" },
          { value: "LIMIT_EXCEEDED", label: "Limit exceeded" },
          { value: "FRAUD_SUSPECTED", label: "Fraud suspected" },
          { value: "INSUFFICIENT_FUNDS", label: "Insufficient funds" },
        ],
        helpText: "Why are we blocking this? (Logged for audit)",
      },
      {
        key: "memberMessage",
        label: "Message to member",
        type: "textarea",
        helpText: "What should we tell them? Be helpful, not scary.",
      },
    ],
  },
  {
    value: "flag_transaction",
    label: "Flag for review",
    icon: Flag,
    description: "Mark this for human review but let it proceed",
    helpText: "The transaction goes through, but your team gets notified to check it later.",
    params: [
      {
        key: "reason",
        label: "Flag reason",
        type: "text",
        helpText: "Why should someone review this?",
      },
      {
        key: "queue",
        label: "Review queue",
        type: "select",
        options: [
          { value: "fraud", label: "Fraud team" },
          { value: "compliance", label: "Compliance team" },
          { value: "operations", label: "Operations team" },
          { value: "general", label: "General review" },
        ],
        helpText: "Which team should look at this?",
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: [
          { value: "low", label: "Low - review when you can" },
          { value: "medium", label: "Medium - review today" },
          { value: "high", label: "High - review immediately" },
          { value: "urgent", label: "Urgent - drop everything" },
        ],
        helpText: "How quickly should this be reviewed?",
      },
    ],
  },
  {
    value: "require_step_up_auth",
    label: "Require extra verification",
    icon: Shield,
    description: "Ask for additional authentication before proceeding",
    helpText: "Make them prove it's really them. Use for high-risk actions like large transfers.",
    params: [
      {
        key: "methods",
        label: "Verification methods",
        type: "multiselect",
        options: [
          { value: "sms_otp", label: "Text message code" },
          { value: "email_otp", label: "Email code" },
          { value: "biometrics", label: "Face ID / Fingerprint" },
          { value: "security_questions", label: "Security questions" },
          { value: "voice", label: "Voice verification" },
        ],
        helpText: "What methods can they use to verify? (Pick at least 2)",
      },
      {
        key: "reason",
        label: "Reason shown to member",
        type: "text",
        helpText: "Why are we asking? e.g., 'For your security, please verify this large transfer'",
      },
    ],
  },
  {
    value: "route_to_queue",
    label: "Route to support queue",
    icon: UserCheck,
    description: "Transfer call or chat to a specific team",
    helpText: "For phone and chat - send them to the right people who can help.",
    params: [
      {
        key: "queue",
        label: "Destination queue",
        type: "select",
        options: [
          { value: "general_support", label: "General support" },
          { value: "fraud_urgent", label: "Fraud team (urgent)" },
          { value: "loans", label: "Loan specialists" },
          { value: "vip_support", label: "VIP member support" },
          { value: "collections", label: "Collections" },
          { value: "technical", label: "Technical support" },
        ],
        helpText: "Where should we send them?",
      },
      {
        key: "priority",
        label: "Queue priority",
        type: "select",
        options: [
          { value: "normal", label: "Normal - wait in line" },
          { value: "priority", label: "Priority - skip some of the line" },
          { value: "critical", label: "Critical - next available agent" },
        ],
        helpText: "How urgently should they be helped?",
      },
    ],
  },
]

export function ActionPanel({ action, onUpdate, onDelete }: ActionPanelProps) {
  const [showTypePicker, setShowTypePicker] = useState(false)

  const selectedType = ACTION_TYPES.find((t) => t.value === action.type)
  const TypeIcon = selectedType?.icon || Bell

  const handleTypeChange = (typeValue: string) => {
    const type = ACTION_TYPES.find((t) => t.value === typeValue)
    if (type) {
      onUpdate({
        ...action,
        type: type.value,
        typeLabel: type.label,
        params: {},
      })
    }
    setShowTypePicker(false)
  }

  const handleParamChange = (key: string, value: unknown) => {
    onUpdate({
      ...action,
      params: {
        ...action.params,
        [key]: value,
      },
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Edit action</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Action Type Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <TypeIcon className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="font-medium">{action.typeLabel}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowTypePicker(!showTypePicker)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          {showTypePicker && (
            <div className="border border-border rounded-lg p-2 space-y-1 bg-muted/50">
              {ACTION_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeChange(type.value)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      action.type === type.value ? "bg-primary/10 border border-primary" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 ml-6">{type.description}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Helper Box */}
        {selectedType && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground/80">
                <p className="font-medium mb-1">What this does:</p>
                <p>{selectedType.helpText}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Parameters */}
        {selectedType && selectedType.params && (
          <div className="space-y-5">
            <h3 className="font-semibold text-sm">Configure this action</h3>

            {selectedType.params.map((param) => (
              <div key={param.key} className="space-y-2">
                <Label className="text-sm font-medium">{param.label}</Label>

                {param.type === "select" && (
                  <Select
                    value={(action.params[param.key] as string) || ""}
                    onValueChange={(value) => handleParamChange(param.key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${param.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {param.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <div>{opt.label}</div>
                            {"description" in opt && opt.description && <div className="text-xs text-muted-foreground">{opt.description}</div>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {param.type === "text" && (
                  <Input
                    value={(action.params[param.key] as string) || ""}
                    onChange={(e) => handleParamChange(param.key, e.target.value)}
                    placeholder={`Enter ${param.label.toLowerCase()}`}
                  />
                )}

                {param.type === "textarea" && (
                  <Textarea
                    value={(action.params[param.key] as string) || ""}
                    onChange={(e) => handleParamChange(param.key, e.target.value)}
                    placeholder={`Enter ${param.label.toLowerCase()}`}
                    rows={3}
                  />
                )}

                {param.type === "boolean" && (
                  <Select
                    value={String(action.params[param.key] || false)}
                    onValueChange={(value) => handleParamChange(param.key, value === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {param.type === "multiselect" && (
                  <div className="space-y-2">
                    {param.options?.map((opt) => {
                      const selected = ((action.params[param.key] as string[]) || []).includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const current = (action.params[param.key] as string[]) || []
                            const updated = selected ? current.filter((v) => v !== opt.value) : [...current, opt.value]
                            handleParamChange(param.key, updated)
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            selected ? "bg-primary/10 border-primary" : "border-border hover:bg-muted",
                          )}
                        >
                          <div className="font-medium text-sm">{opt.label}</div>
                        </button>
                      )
                    })}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{param.helpText}</p>
              </div>
            ))}
          </div>
        )}

        {/* Append Data Section (for notifications) */}
        {action.type === "notify_member" && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <h3 className="font-semibold text-sm">Include data in message</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Pull in information from the trigger to personalize the message.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { label: "Member name", value: "member.fullName" },
                { label: "Amount", value: "transfer.amount" },
                { label: "Account (last 4)", value: "account.numberLast4" },
              ].map((item) => (
                <div key={item.value} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Input value={item.label} className="w-32 h-8 text-sm" readOnly />
                    <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded flex items-center gap-1">
                      <span>Trigger</span>
                      <span className="font-mono">{item.value}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
              <Plus className="h-4 w-4" />
              Add data field
            </Button>
          </div>
        )}

        {/* Preview Button */}
        <Button variant="outline" className="w-full gap-2 bg-transparent">
          <Eye className="h-4 w-4" />
          Preview this action
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete this action
        </Button>
      </div>
    </div>
  )
}
