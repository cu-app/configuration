"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Plus, X, Pencil, HelpCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RuleTrigger, RuleCondition } from "./rule-canvas"

interface TriggerPanelProps {
  trigger: RuleTrigger
  onUpdate: (trigger: RuleTrigger) => void
}

// Trigger event options with plain-language descriptions
const TRIGGER_EVENTS = [
  {
    value: "transfer.initiated",
    label: "Transfer initiated",
    icon: "dollar",
    description: "Fires when a member starts any kind of money transfer",
    helpText: "Use this to check transfers before they happen. You can approve, deny, or add extra steps.",
  },
  {
    value: "transfer.completed",
    label: "Transfer completed",
    icon: "dollar",
    description: "Fires after a transfer successfully finishes",
    helpText: "Great for sending confirmations or updating records after money moves.",
  },
  {
    value: "login.success",
    label: "Member logged in",
    icon: "user",
    description: "Fires when someone successfully signs into their account",
    helpText: "Use this to show welcome messages, check for suspicious activity, or update preferences.",
  },
  {
    value: "login.failed",
    label: "Failed login attempt",
    icon: "shield",
    description: "Fires when someone enters wrong credentials",
    helpText: "Detect potential fraud or help members who are locked out.",
  },
  {
    value: "card.transaction",
    label: "Card transaction",
    icon: "card",
    description: "Fires when a debit or credit card is used",
    helpText: "Monitor spending, detect fraud, or send real-time transaction alerts.",
  },
  {
    value: "call.incoming",
    label: "Phone call received",
    icon: "phone",
    description: "Fires when a member calls your phone banking system",
    helpText: "Route calls to the right department or identify VIP members for priority service.",
  },
  {
    value: "account.balance_low",
    label: "Balance falls below threshold",
    icon: "dollar",
    description: "Fires when an account balance drops below a set amount",
    helpText: "Warn members before they overdraft or suggest automatic transfers.",
  },
]

// Condition property options with helpers
const CONDITION_PROPERTIES = [
  {
    value: "transfer.amount",
    label: "Amount",
    type: "currency",
    helpText: "The dollar amount of the transfer. Use this to treat large transfers differently.",
  },
  {
    value: "member.age",
    label: "Member age",
    type: "number",
    helpText: "How old the member is. Useful for age-restricted features or senior discounts.",
  },
  {
    value: "member.accountAge.days",
    label: "Account age (days)",
    type: "number",
    helpText: "How long they've been a member. New members might have different limits.",
  },
  {
    value: "account.balance",
    label: "Account balance",
    type: "currency",
    helpText: "Current balance in the account. Check if they have enough money.",
  },
  {
    value: "account.type",
    label: "Account type",
    type: "select",
    options: ["checking", "savings", "cd", "ira", "loan"],
    helpText: "What kind of account this is. Different rules for different accounts.",
  },
  {
    value: "device.platform",
    label: "Device type",
    type: "select",
    options: ["ios", "android", "web"],
    helpText: "What device they're using. Show different features on mobile vs desktop.",
  },
  {
    value: "member.membershipTier",
    label: "Membership tier",
    type: "select",
    options: ["basic", "silver", "gold", "platinum", "diamond"],
    helpText: "Their loyalty status. VIP members might get special treatment.",
  },
  {
    value: "warningCode.hasAny",
    label: "Has warning codes",
    type: "boolean",
    helpText: "Whether the account is flagged for any issues like fraud or restrictions.",
  },
  {
    value: "session.riskScore",
    label: "Risk score",
    type: "number",
    helpText: "How suspicious this session looks (0-100). Higher = more risky.",
  },
]

// Operators with plain-language labels
const OPERATORS = [
  { value: "eq", label: "equals", description: "Exactly matches this value" },
  { value: "neq", label: "does not equal", description: "Is anything except this value" },
  { value: "gt", label: "is greater than", description: "More than this number" },
  { value: "gte", label: "is at least", description: "This number or higher" },
  { value: "lt", label: "is less than", description: "Below this number" },
  { value: "lte", label: "is at most", description: "This number or lower" },
  { value: "contains", label: "contains", description: "Has this text somewhere inside" },
  { value: "in", label: "is one of", description: "Matches any item in a list" },
]

export function TriggerPanel({ trigger, onUpdate }: TriggerPanelProps) {
  const [showEventPicker, setShowEventPicker] = useState(false)

  const selectedEvent = TRIGGER_EVENTS.find((e) => e.value === trigger.event)

  const handleEventChange = (eventValue: string) => {
    const event = TRIGGER_EVENTS.find((e) => e.value === eventValue)
    if (event) {
      onUpdate({
        ...trigger,
        event: event.value,
        eventLabel: event.label,
        icon: event.icon,
      })
    }
    setShowEventPicker(false)
  }

  const handleAddCondition = () => {
    const newCondition: RuleCondition = {
      id: crypto.randomUUID(),
      property: "transfer.amount",
      operator: "gte",
      value: 0,
    }
    onUpdate({
      ...trigger,
      conditions: [...trigger.conditions, newCondition],
    })
  }

  const handleUpdateCondition = (conditionId: string, updates: Partial<RuleCondition>) => {
    onUpdate({
      ...trigger,
      conditions: trigger.conditions.map((c) => (c.id === conditionId ? { ...c, ...updates } : c)),
    })
  }

  const handleRemoveCondition = (conditionId: string) => {
    onUpdate({
      ...trigger,
      conditions: trigger.conditions.filter((c) => c.id !== conditionId),
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Edit trigger</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Event Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">{trigger.eventLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowEventPicker(!showEventPicker)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          {showEventPicker && (
            <div className="border border-border rounded-lg p-2 space-y-1 bg-muted/50">
              {TRIGGER_EVENTS.map((event) => (
                <button
                  key={event.value}
                  onClick={() => handleEventChange(event.value)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    trigger.event === event.value ? "bg-primary/10 border border-primary" : "hover:bg-muted",
                  )}
                >
                  <div className="font-medium text-sm">{event.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{event.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Helper Box */}
        {selectedEvent && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground/80">
                <p className="font-medium mb-1">What this does:</p>
                <p>{selectedEvent.helpText}</p>
              </div>
            </div>
          </div>
        )}

        {/* Conditions Section */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm">Trigger conditions</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add filters so this rule only runs in specific situations. Without conditions, this trigger fires for
              everyone, every time.
            </p>
          </div>

          {/* Condition Cards */}
          {trigger.conditions.map((condition, index) => (
            <ConditionCard
              key={condition.id}
              condition={condition}
              onUpdate={(updates) => handleUpdateCondition(condition.id, updates)}
              onRemove={() => handleRemoveCondition(condition.id)}
              isFirst={index === 0}
            />
          ))}

          {/* Add Condition Button */}
          <Button variant="outline" size="sm" onClick={handleAddCondition} className="w-full gap-2 bg-transparent">
            <Plus className="h-4 w-4" />
            Add condition
          </Button>

          {/* No conditions helper */}
          {trigger.conditions.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex gap-2">
                <HelpCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground/80">
                  <p className="font-medium mb-1">No conditions yet</p>
                  <p>
                    This rule will trigger for ALL {trigger.eventLabel.toLowerCase()}s. Add conditions to be more
                    specific, like "only for transfers over $1,000".
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Condition Card Component
function ConditionCard({
  condition,
  onUpdate,
  onRemove,
  isFirst,
}: {
  condition: RuleCondition
  onUpdate: (updates: Partial<RuleCondition>) => void
  onRemove: () => void
  isFirst: boolean
}) {
  const selectedProperty = CONDITION_PROPERTIES.find((p) => p.value === condition.property)

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
      {/* Logic connector */}
      {!isFirst && (
        <div className="flex items-center gap-2 -mt-2 mb-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">AND</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* If label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">If</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Property Select */}
      <div className="space-y-2">
        <Select value={condition.property} onValueChange={(value) => onUpdate({ property: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_PROPERTIES.map((prop) => (
              <SelectItem key={prop.value} value={prop.value}>
                {prop.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator Select */}
      <div className="space-y-2">
        <Select value={condition.operator} onValueChange={(value) => onUpdate({ operator: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value Input */}
      <div className="space-y-2">
        {selectedProperty?.type === "currency" && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              value={condition.value as number}
              onChange={(e) => onUpdate({ value: Number.parseFloat(e.target.value) || 0 })}
              className="pl-7"
              placeholder="0.00"
            />
          </div>
        )}
        {selectedProperty?.type === "number" && (
          <Input
            type="number"
            value={condition.value as number}
            onChange={(e) => onUpdate({ value: Number.parseFloat(e.target.value) || 0 })}
            placeholder="Enter a number"
          />
        )}
        {selectedProperty?.type === "select" && (
          <Select value={condition.value as string} onValueChange={(value) => onUpdate({ value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {selectedProperty.options?.map((opt) => (
                <SelectItem key={opt} value={opt} className="capitalize">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedProperty?.type === "boolean" && (
          <Select value={String(condition.value)} onValueChange={(value) => onUpdate({ value: value === "true" })}>
            <SelectTrigger>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Property Helper */}
      {selectedProperty && <p className="text-xs text-muted-foreground">{selectedProperty.helpText}</p>}
    </div>
  )
}
