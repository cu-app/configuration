"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Zap,
  Mail,
  Bell,
  Shield,
  DollarSign,
  CreditCard,
  Phone,
  AlertTriangle,
  Play,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  Save,
  Eye,
  Search,
  Settings,
  HelpCircle,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TriggerPanel } from "./trigger-panel"
import { ActionPanel } from "./action-panel"
import Link from "next/link"

// Types for our rule builder
export interface RuleCondition {
  id: string
  property: string
  operator: string
  value: string | number | boolean | string[]
}

export interface RuleTrigger {
  id: string
  event: string
  eventLabel: string
  icon: string
  conditions: RuleCondition[]
}

export interface RuleAction {
  id: string
  type: string
  typeLabel: string
  icon: string
  params: Record<string, unknown>
}

export interface Rule {
  id: string
  name: string
  status: "draft" | "active" | "paused"
  trigger: RuleTrigger
  actions: RuleAction[]
}

// Helper to render icons
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  mail: Mail,
  bell: Bell,
  shield: Shield,
  dollar: DollarSign,
  card: CreditCard,
  phone: Phone,
  alert: AlertTriangle,
  play: Play,
  user: User,
}

function NodeIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = IconMap[icon] || Zap
  return <Icon className={className} />
}

// Sample rule for demo
const sampleRule: Rule = {
  id: "rule-001",
  name: "Large Transfer Notification",
  status: "draft",
  trigger: {
    id: "trigger-001",
    event: "transfer.initiated",
    eventLabel: "Transfer initiated",
    icon: "dollar",
    conditions: [
      {
        id: "cond-001",
        property: "transfer.amount",
        operator: "gte",
        value: 1000,
      },
    ],
  },
  actions: [
    {
      id: "action-001",
      type: "notify_member",
      typeLabel: "Send notification",
      icon: "bell",
      params: {
        channel: "push",
        template: "large_transfer_alert",
      },
    },
  ],
}

export function RuleCanvas() {
  const [rule, setRule] = useState<Rule>(sampleRule)
  const [selectedNode, setSelectedNode] = useState<"trigger" | "action" | null>("trigger")
  const [selectedActionId, setSelectedActionId] = useState<string | null>(rule.actions[0]?.id || null)
  const [isRenaming, setIsRenaming] = useState(false)

  const handleTriggerClick = useCallback(() => {
    setSelectedNode("trigger")
    setSelectedActionId(null)
  }, [])

  const handleActionClick = useCallback((actionId: string) => {
    setSelectedNode("action")
    setSelectedActionId(actionId)
  }, [])

  const handleAddAction = useCallback(() => {
    const newAction: RuleAction = {
      id: crypto.randomUUID(),
      type: "show_alert",
      typeLabel: "Show alert",
      icon: "bell",
      params: {},
    }
    setRule((prev) => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }))
    setSelectedNode("action")
    setSelectedActionId(newAction.id)
  }, [])

  const handleUpdateTrigger = useCallback((trigger: RuleTrigger) => {
    setRule((prev) => ({ ...prev, trigger }))
  }, [])

  const handleUpdateAction = useCallback((action: RuleAction) => {
    setRule((prev) => ({
      ...prev,
      actions: prev.actions.map((a) => (a.id === action.id ? action : a)),
    }))
  }, [])

  const handleDeleteAction = useCallback(
    (actionId: string) => {
      setRule((prev) => ({
        ...prev,
        actions: prev.actions.filter((a) => a.id !== actionId),
      }))
      if (selectedActionId === actionId) {
        setSelectedNode("trigger")
        setSelectedActionId(null)
      }
    },
    [selectedActionId],
  )

  const selectedAction = rule.actions.find((a) => a.id === selectedActionId)

  return (
    <div className="flex h-screen bg-background">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-card">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search" className="w-64 pl-9 h-9 bg-background" />
            </div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="h-5 w-5" />
            </Button>
            <Button size="icon" className="h-9 w-9 rounded-full bg-primary">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Secondary Header with rule name */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            {isRenaming ? (
              <Input
                autoFocus
                value={rule.name}
                onChange={(e) => setRule((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => setIsRenaming(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsRenaming(false)}
                className="h-8 w-64 text-lg font-semibold"
              />
            ) : (
              <button onClick={() => setIsRenaming(true)} className="text-lg font-semibold hover:text-foreground/80">
                {rule.name}
              </button>
            )}
            <Badge variant={rule.status === "active" ? "default" : "secondary"} className="capitalize">
              {rule.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save draft
            </Button>
            <Button size="sm" className="bg-primary">
              Publish
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-auto bg-muted/30">
          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Nodes */}
          <div className="relative z-10 flex flex-col items-center py-12 min-h-full">
            {/* Trigger Node */}
            <div
              onClick={handleTriggerClick}
              className={cn(
                "bg-card border-2 rounded-xl p-4 w-80 cursor-pointer transition-all shadow-sm hover:shadow-md group",
                selectedNode === "trigger" && selectedActionId === null
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <NodeIcon icon={rule.trigger.icon} className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">When this happens</p>
                  <p className="font-semibold text-foreground truncate">{rule.trigger.eventLabel}</p>
                  {rule.trigger.conditions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {rule.trigger.conditions.map((cond) => (
                        <div key={cond.id} className="text-xs bg-muted rounded px-2 py-1 text-muted-foreground">
                          {formatCondition(cond)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex flex-col items-center py-2">
              <div className="h-4 w-0.5 bg-border" />
              <div className="h-3 w-3 rounded-full border-2 border-primary bg-card" />
              <div className="h-4 w-0.5 bg-border" />
            </div>

            {/* Action Nodes */}
            {rule.actions.map((action, index) => (
              <div key={action.id} className="flex flex-col items-center">
                <div
                  onClick={() => handleActionClick(action.id)}
                  className={cn(
                    "bg-card border-2 rounded-xl p-4 w-80 cursor-pointer transition-all shadow-sm hover:shadow-md group",
                    selectedNode === "action" && selectedActionId === action.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <NodeIcon icon={action.icon} className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">Take this action</p>
                      <p className="font-semibold text-foreground truncate">{action.typeLabel}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteAction(action.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Connector after action */}
                {index < rule.actions.length - 1 && (
                  <div className="flex flex-col items-center py-2">
                    <div className="h-4 w-0.5 bg-border" />
                    <div className="h-3 w-3 rounded-full border-2 border-border bg-card" />
                    <div className="h-4 w-0.5 bg-border" />
                  </div>
                )}
              </div>
            ))}

            {/* Final connector and add button */}
            <div className="flex flex-col items-center py-2">
              <div className="h-4 w-0.5 bg-border" />
              <div className="h-3 w-3 rounded-full border-2 border-primary bg-card" />
              <div className="h-6 w-0.5 bg-border" />
            </div>

            <Button variant="outline" size="sm" onClick={handleAddAction} className="gap-2 bg-card">
              <Plus className="h-4 w-4" />
              Add action
            </Button>
          </div>

          {/* Setup Guide - floating in bottom left */}
          <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg shadow-lg p-4 w-72">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Setup guide</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-1 bg-muted rounded-full mb-3">
              <div className="h-1 bg-primary rounded-full w-1/3" />
            </div>
            <p className="text-sm text-muted-foreground">
              Next: <button className="text-primary hover:underline">Add conditions to your trigger</button>
            </p>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 hidden">
            <div className="flex flex-col gap-1 bg-card border border-border rounded-lg shadow-sm p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="text-xs">100%</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-96 border-l border-border bg-card overflow-y-auto">
        {selectedNode === "trigger" && <TriggerPanel trigger={rule.trigger} onUpdate={handleUpdateTrigger} />}
        {selectedNode === "action" && selectedAction && (
          <ActionPanel
            action={selectedAction}
            onUpdate={handleUpdateAction}
            onDelete={() => handleDeleteAction(selectedAction.id)}
          />
        )}
      </div>
    </div>
  )
}

// Helper to format condition for display
function formatCondition(cond: RuleCondition): string {
  const operatorLabels: Record<string, string> = {
    eq: "equals",
    neq: "does not equal",
    gt: "is greater than",
    gte: "is at least",
    lt: "is less than",
    lte: "is at most",
    contains: "contains",
    in: "is one of",
  }

  const propertyLabels: Record<string, string> = {
    "transfer.amount": "Amount",
    "member.age": "Member age",
    "account.balance": "Account balance",
    "member.membershipTier": "Membership tier",
    "device.platform": "Device",
  }

  const prop = propertyLabels[cond.property] || cond.property
  const op = operatorLabels[cond.operator] || cond.operator
  const val = typeof cond.value === "number" ? `$${cond.value.toLocaleString()}` : String(cond.value)

  return `${prop} ${op} ${val}`
}
