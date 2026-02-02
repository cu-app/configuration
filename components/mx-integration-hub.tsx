"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Zap,
  Database,
  Code2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Settings,
  Eye,
  Download,
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface MXIntegrationHubProps {
  cu: CreditUnionData
}

const MX_CAPABILITIES = [
  {
    id: "account-aggregation",
    name: "Account Aggregation",
    icon: <CreditCard className="h-5 w-5" />,
    mxCost: "$15K/year",
    edgeCost: "$0",
    description: "Link external bank accounts and credit cards",
  },
  {
    id: "transaction-history",
    name: "Transaction History",
    icon: <TrendingUp className="h-5 w-5" />,
    mxCost: "$10K/year",
    edgeCost: "$0",
    description: "Fetch and categorize transaction data",
  },
  {
    id: "spending-insights",
    name: "Spending Insights",
    icon: <Sparkles className="h-5 w-5" />,
    mxCost: "$20K/year",
    edgeCost: "$0",
    description: "AI-powered spending analysis and budgets",
  },
  {
    id: "balance-tracking",
    name: "Balance Tracking",
    icon: <PiggyBank className="h-5 w-5" />,
    mxCost: "$8K/year",
    edgeCost: "$0",
    description: "Real-time balance updates across accounts",
  },
  {
    id: "credit-score",
    name: "Credit Score Monitoring",
    icon: <TrendingUp className="h-5 w-5" />,
    mxCost: "$12K/year",
    edgeCost: "$0",
    description: "Free credit score checks and monitoring",
  },
]

const SUPABASE_TABLES = [
  { name: "external_accounts", rows: "234", description: "Linked external bank accounts" },
  { name: "transactions", rows: "45,892", description: "All transaction history" },
  { name: "spending_categories", rows: "28", description: "Transaction categorization" },
  { name: "budgets", rows: "156", description: "Member budgets and goals" },
  { name: "insights", rows: "1,234", description: "AI-generated spending insights" },
  { name: "balance_snapshots", rows: "3,456", description: "Historical balance tracking" },
  { name: "credit_scores", rows: "189", description: "Credit score history" },
]

const EDGE_FUNCTIONS = [
  { name: "fetch-transactions", calls: "12.5K/day", cost: "$0.20/day", description: "Fetch transaction data from Plaid/Finicity" },
  { name: "categorize-spending", calls: "8.2K/day", cost: "$0.15/day", description: "AI categorization of transactions" },
  { name: "calculate-insights", calls: "1.2K/day", cost: "$0.05/day", description: "Generate spending insights" },
  { name: "update-balances", calls: "15.8K/day", cost: "$0.25/day", description: "Real-time balance updates" },
]

export function MXIntegrationHub({ cu }: MXIntegrationHubProps) {
  const [activeTab, setActiveTab] = useState("comparison")

  const totalMXCost = 150 // $150K/year
  const totalEdgeCost = 1.2 // $1.2K/year (Supabase + Edge Functions)
  const adapterCost = 50 // $50K one-time

  return (
    <div className="h-full flex flex-col p-6 max-w-[1800px] mx-auto">
      {/* Header with MX Logo */}
      <div className="mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* MX Logo */}
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <svg width="77" height="35" viewBox="0 0 77 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="logo">
                      <g id="MX LOGO White">
                        <path id="Fill 1" fillRule="evenodd" clipRule="evenodd" d="M40.2362 33.4237L44.6649 27.7595C44.7018 27.7223 44.7018 27.6483 44.7018 27.6115L40.7944 0.80832C40.7944 0.697051 40.6831 0.623047 40.5713 0.623047H35.4731C35.3987 0.623047 35.3238 0.660311 35.2868 0.734316L23.1177 25.3898C23.0433 25.5383 22.8196 25.5383 22.7452 25.3898L10.4643 0.734316C10.4274 0.660311 10.353 0.623047 10.2786 0.623047H5.14294C5.03109 0.623047 4.9567 0.697051 4.91977 0.80832L0.00728769 34.4603C-0.0301719 34.5716 0.0816792 34.6823 0.230462 34.6823H6.18495C6.29628 34.6823 6.37067 34.6083 6.40813 34.4971L9.38537 12.9141C9.4223 12.692 9.68294 12.6548 9.79479 12.8401L20.6243 34.5716C20.6612 34.6456 20.7356 34.6823 20.81 34.6823H25.0155C25.0899 34.6823 25.1643 34.6456 25.2012 34.5716L35.8825 13.1361C35.9938 12.9513 36.2544 12.9881 36.2914 13.2101L39.1942 34.127C39.2317 34.3123 39.4549 34.3858 39.5662 34.2383L40.2362 33.4237Z" fill="#28282A"/>
                        <g id="Group 5">
                          <mask id="mask0_4236_517" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="42" y="0" width="35" height="35">
                            <path id="Clip 4" fillRule="evenodd" clipRule="evenodd" d="M42.6094 34.7194H76.7338V0.623047H42.6094V34.7194H42.6094Z" fill="white"/>
                          </mask>
                          <g mask="url(#mask0_4236_517)">
                            <path id="Fill 3" fillRule="evenodd" clipRule="evenodd" d="M69.0018 0.623047C68.9274 0.623047 68.89 0.660311 68.8161 0.697051L59.8469 12.396C59.7725 12.5068 59.5868 12.5068 59.5119 12.396L50.5063 0.697051C50.4688 0.660311 50.3944 0.623047 50.32 0.623047H42.8397C42.654 0.623047 42.5796 0.84506 42.654 0.956329L55.5301 17.5417C55.6045 17.6157 55.6045 17.727 55.5301 17.801L42.654 34.3863C42.5422 34.5343 42.654 34.7196 42.8397 34.7196H50.32C50.3944 34.7196 50.4319 34.6823 50.5063 34.6456L59.5119 22.9466C59.5868 22.8359 59.7725 22.8359 59.8469 22.9466L68.853 34.6456C68.89 34.6823 68.9644 34.7196 69.0393 34.7196H76.5191C76.7053 34.7196 76.7797 34.4976 76.7053 34.3863L63.8292 17.801C63.7543 17.727 63.7543 17.6157 63.8292 17.5417L76.7053 0.956329C76.7428 0.80832 76.6684 0.623047 76.4821 0.623047H69.0018Z" fill="#28282A"/>
                          </g>
                        </g>
                      </g>
                    </g>
                  </svg>
                </div>

                <div>
                  <h1 className="text-2xl font-bold mb-1">MX Integration Alternative</h1>
                  <p className="text-muted-foreground">
                    Replace $150K/year MX subscription with $50K one-time adapter + Supabase
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Eye className="h-4 w-4" />
                  Preview Widgets
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
                  <Settings className="h-4 w-4" />
                  Configure Adapter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="comparison">Cost Comparison</TabsTrigger>
          <TabsTrigger value="widgets">Widget Book</TabsTrigger>
          <TabsTrigger value="tables">Supabase Tables</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Cost Comparison */}
          <TabsContent value="comparison" className="space-y-6 mt-0">
            <div className="grid grid-cols-2 gap-6">
              {/* MX Subscription */}
              <Card className="border-red-500/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    MX Subscription Model
                  </CardTitle>
                  <CardDescription>Ongoing annual costs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6 border-b">
                    <div className="text-4xl font-bold text-red-600">${totalMXCost}K</div>
                    <p className="text-sm text-muted-foreground">per year</p>
                  </div>

                  {MX_CAPABILITIES.map((cap) => (
                    <div key={cap.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        {cap.icon}
                        <span className="text-sm">{cap.name}</span>
                      </div>
                      <Badge variant="destructive">{cap.mxCost}</Badge>
                    </div>
                  ))}

                  <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                    <p>• Vendor lock-in</p>
                    <p>• Annual price increases</p>
                    <p>• Per-member fees</p>
                    <p>• Limited customization</p>
                  </div>
                </CardContent>
              </Card>

              {/* Supabase + Edge Functions */}
              <Card className="border-green-500/50 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    Supabase + Edge Functions
                  </CardTitle>
                  <CardDescription>One-time adapter + hosting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6 border-b">
                    <div className="text-4xl font-bold text-green-600">${adapterCost}K</div>
                    <p className="text-sm text-muted-foreground">one-time + ${totalEdgeCost}K/year hosting</p>
                  </div>

                  {MX_CAPABILITIES.map((cap) => (
                    <div key={cap.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        {cap.icon}
                        <span className="text-sm">{cap.name}</span>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/50">
                        {cap.edgeCost}
                      </Badge>
                    </div>
                  ))}

                  <div className="pt-4 space-y-2 text-sm text-green-600">
                    <p>✓ No vendor lock-in</p>
                    <p>✓ Own your data</p>
                    <p>✓ Full customization</p>
                    <p>✓ Unlimited members</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROI Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis - 5 Year Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-red-500/10 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">${totalMXCost * 5}K</div>
                      <p className="text-sm text-muted-foreground">MX 5-year total cost</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">${adapterCost + (totalEdgeCost * 5)}K</div>
                      <p className="text-sm text-muted-foreground">Supabase 5-year total cost</p>
                    </div>
                  </div>

                  <div className="text-center p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg">
                    <div className="text-4xl font-bold">${(totalMXCost * 5) - (adapterCost + (totalEdgeCost * 5))}K</div>
                    <p className="text-lg font-semibold mt-2">Savings Over 5 Years</p>
                    <p className="text-sm text-muted-foreground mt-1">Break-even in 6 months</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Widget Book */}
          <TabsContent value="widgets" className="space-y-6 mt-0">
            <div className="grid grid-cols-2 gap-6">
              {MX_CAPABILITIES.map((cap) => (
                <Card key={cap.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {cap.icon}
                      {cap.name}
                    </CardTitle>
                    <CardDescription>{cap.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Widget Preview</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Code2 className="h-4 w-4 mr-2" />
                        View Code
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Supabase Tables */}
          <TabsContent value="tables" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Supabase Tables ({cu.displayName})
                </CardTitle>
                <CardDescription>All financial data stored in your own database</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {SUPABASE_TABLES.map((table) => (
                    <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-mono text-sm font-medium">{table.name}</p>
                          <p className="text-xs text-muted-foreground">{table.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{table.rows} rows</Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Edge Functions */}
          <TabsContent value="edge" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Edge Functions
                </CardTitle>
                <CardDescription>Serverless functions replacing MX APIs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {EDGE_FUNCTIONS.map((func) => (
                    <div key={func.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-mono text-sm font-medium">{func.name}</p>
                          <p className="text-xs text-muted-foreground">{func.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{func.calls}</Badge>
                        <Badge variant="secondary">{func.cost}</Badge>
                        <Button size="sm" variant="ghost">
                          <Code2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Total Daily Cost</p>
                      <p className="text-sm text-muted-foreground">All edge functions combined</p>
                    </div>
                    <div className="text-2xl font-bold">$0.65/day</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">≈ $237/year vs $150K/year MX</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
