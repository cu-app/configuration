"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  FileText, 
  Video,
  Download,
  Upload,
  TestTube,
  Bug,
  CheckSquare,
  AlertCircle
} from "lucide-react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { useExportAllowed } from "@/hooks/use-export-allowed"

interface TestCase {
  id: string
  name: string
  description: string
  status: "passed" | "failed" | "pending" | "running"
  category: "functional" | "integration" | "e2e" | "regression"
  duration?: number
  error?: string
  lastRun?: string
}

interface TestSuite {
  id: string
  name: string
  description: string
  testCases: TestCase[]
  totalTests: number
  passedTests: number
  failedTests: number
  pendingTests: number
}

export function UATView({ cu }: { cu: CreditUnionData | null }) {
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set())
  const { allowed: exportAllowed, reason: exportLockedReason } = useExportAllowed(cu?.id ?? null)

  // Mock test suites - in real implementation, fetch from API
  const [testSuites] = useState<TestSuite[]>([
    {
      id: "auth-flow",
      name: "Authentication Flow",
      description: "Tests for login, logout, and session management",
      totalTests: 5,
      passedTests: 4,
      failedTests: 1,
      pendingTests: 0,
      testCases: [
        {
          id: "auth-001",
          name: "User can sign in with valid credentials",
          description: "Verify successful login with correct username/password",
          status: "passed",
          category: "functional",
          duration: 1.2,
          lastRun: "2025-01-26T10:30:00Z"
        },
        {
          id: "auth-002",
          name: "User cannot sign in with invalid credentials",
          description: "Verify error handling for wrong password",
          status: "passed",
          category: "functional",
          duration: 0.8,
          lastRun: "2025-01-26T10:30:00Z"
        },
        {
          id: "auth-003",
          name: "Session persists after app restart",
          description: "Verify user stays logged in after closing app",
          status: "passed",
          category: "functional",
          duration: 2.1,
          lastRun: "2025-01-26T10:30:00Z"
        },
        {
          id: "auth-004",
          name: "User can sign out",
          description: "Verify logout functionality",
          status: "passed",
          category: "functional",
          duration: 0.5,
          lastRun: "2025-01-26T10:30:00Z"
        },
        {
          id: "auth-005",
          name: "Token refresh works correctly",
          description: "Verify automatic token refresh before expiration",
          status: "failed",
          category: "integration",
          duration: 3.2,
          error: "Token refresh endpoint returned 401",
          lastRun: "2025-01-26T10:30:00Z"
        }
      ]
    },
    {
      id: "account-overview",
      name: "Account Overview",
      description: "Tests for account dashboard and balance display",
      totalTests: 8,
      passedTests: 7,
      failedTests: 0,
      pendingTests: 1,
      testCases: [
        {
          id: "overview-001",
          name: "Overview page loads with account data",
          description: "Verify accounts are displayed correctly",
          status: "passed",
          category: "e2e",
          duration: 1.5,
          lastRun: "2025-01-26T10:25:00Z"
        },
        {
          id: "overview-002",
          name: "Account balances are formatted correctly",
          description: "Verify currency formatting",
          status: "passed",
          category: "functional",
          duration: 0.3,
          lastRun: "2025-01-26T10:25:00Z"
        },
        {
          id: "overview-003",
          name: "Account cards are clickable",
          description: "Verify navigation to account detail",
          status: "passed",
          category: "e2e",
          duration: 0.9,
          lastRun: "2025-01-26T10:25:00Z"
        },
        {
          id: "overview-004",
          name: "Loading skeleton displays during fetch",
          description: "Verify loading states",
          status: "passed",
          category: "functional",
          duration: 0.4,
          lastRun: "2025-01-26T10:25:00Z"
        },
        {
          id: "overview-005",
          name: "Error message displays on API failure",
          description: "Verify error handling",
          status: "passed",
          category: "functional",
          duration: 0.6,
          lastRun: "2025-01-26T10:25:00Z"
        },
        {
          id: "overview-006",
          name: "Refresh pulls latest data",
          description: "Verify pull-to-refresh functionality",
          status: "passed",
          category: "e2e",
          duration: 1.8,
          lastRun: "2025-01-26T10:25:00Z"
        },
        {
          id: "overview-007",
          name: "Account grouping works correctly",
          description: "Verify accounts are grouped by type",
          status: "passed",
          category: "functional",
          duration: 0.7,
          lastRun: "2025-01-26T10:25:00Z"
        },
        {
          id: "overview-008",
          name: "Empty state displays when no accounts",
          description: "Verify empty state UI",
          status: "pending",
          category: "functional"
        }
      ]
    },
    {
      id: "move-money",
      name: "Move Money",
      description: "Tests for transfers, bill pay, and P2P",
      totalTests: 12,
      passedTests: 10,
      failedTests: 1,
      pendingTests: 1,
      testCases: [
        {
          id: "transfer-001",
          name: "User can initiate transfer",
          description: "Verify transfer form loads",
          status: "passed",
          category: "e2e",
          duration: 1.2,
          lastRun: "2025-01-26T10:20:00Z"
        },
        {
          id: "transfer-002",
          name: "Transfer validation works",
          description: "Verify amount and account validation",
          status: "passed",
          category: "functional",
          duration: 0.5,
          lastRun: "2025-01-26T10:20:00Z"
        },
        {
          id: "transfer-003",
          name: "Transfer executes successfully",
          description: "Verify successful transfer completion",
          status: "passed",
          category: "integration",
          duration: 2.3,
          lastRun: "2025-01-26T10:20:00Z"
        },
        {
          id: "transfer-004",
          name: "Transfer confirmation displays",
          description: "Verify confirmation screen",
          status: "passed",
          category: "e2e",
          duration: 0.8,
          lastRun: "2025-01-26T10:20:00Z"
        },
        {
          id: "transfer-005",
          name: "Insufficient funds error handled",
          description: "Verify error for insufficient balance",
          status: "failed",
          category: "functional",
          duration: 1.1,
          error: "Error message not displaying correctly",
          lastRun: "2025-01-26T10:20:00Z"
        }
      ]
    },
    {
      id: "pdf-viewer",
      name: "PDF Viewer",
      description: "Tests for PDF viewing and interaction",
      totalTests: 6,
      passedTests: 6,
      failedTests: 0,
      pendingTests: 0,
      testCases: [
        {
          id: "pdf-001",
          name: "PDF loads and displays correctly",
          description: "Verify PDF rendering",
          status: "passed",
          category: "e2e",
          duration: 2.1,
          lastRun: "2025-01-26T10:15:00Z"
        },
        {
          id: "pdf-002",
          name: "PDF search functionality works",
          description: "Verify text search in PDF",
          status: "passed",
          category: "functional",
          duration: 1.5,
          lastRun: "2025-01-26T10:15:00Z"
        },
        {
          id: "pdf-003",
          name: "PDF zoom works correctly",
          description: "Verify zoom in/out functionality",
          status: "passed",
          category: "functional",
          duration: 0.9,
          lastRun: "2025-01-26T10:15:00Z"
        }
      ]
    }
  ])

  const runTest = async (testId: string) => {
    setRunningTests(prev => new Set(prev).add(testId))
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 2000))
    setRunningTests(prev => {
      const next = new Set(prev)
      next.delete(testId)
      return next
    })
  }

  const runSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId)
    if (!suite) return

    suite.testCases.forEach(test => {
      if (test.status !== "passed") {
        runTest(test.id)
      }
    })
  }

  const getStatusIcon = (status: TestCase["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestCase["status"]) => {
    switch (status) {
      case "passed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Passed</Badge>
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
      case "running":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Running</Badge>
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Pending</Badge>
    }
  }

  const getCategoryBadge = (category: TestCase["category"]) => {
    const colors = {
      functional: "bg-blue-50 text-blue-700 border-blue-200",
      integration: "bg-purple-50 text-purple-700 border-purple-200",
      e2e: "bg-orange-50 text-orange-700 border-orange-200",
      regression: "bg-pink-50 text-pink-700 border-pink-200"
    }
    return <Badge variant="outline" className={colors[category]}>{category.toUpperCase()}</Badge>
  }

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0)
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0)
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0)
  const totalPending = testSuites.reduce((sum, suite) => sum + suite.pendingTests, 0)
  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0"

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Acceptance Testing</h1>
          <p className="text-muted-foreground mt-1">
            Test suites and results for {cu?.displayName || "Credit Union"} app
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!exportAllowed}
            title={!exportAllowed ? exportLockedReason ?? undefined : undefined}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Tests
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPassed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Suites */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Suites</TabsTrigger>
          <TabsTrigger value="functional">Functional</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="e2e">E2E</TabsTrigger>
        </TabsList>

        <div className="space-y-4">
          {testSuites.map(suite => (
            <Card key={suite.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{suite.name}</CardTitle>
                      <Badge variant="outline">{suite.totalTests} tests</Badge>
                    </div>
                    <CardDescription className="mt-1">{suite.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div className="text-green-600 font-medium">{suite.passedTests} passed</div>
                      {suite.failedTests > 0 && (
                        <div className="text-red-600 font-medium">{suite.failedTests} failed</div>
                      )}
                      {suite.pendingTests > 0 && (
                        <div className="text-gray-500">{suite.pendingTests} pending</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runSuite(suite.id)}
                      disabled={runningTests.size > 0}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Suite
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suite.testCases.map(test => (
                    <div
                      key={test.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedSuite(selectedSuite === suite.id ? null : suite.id)}
                    >
                      <div className="mt-0.5">
                        {getStatusIcon(test.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{test.name}</span>
                          {getStatusBadge(test.status)}
                          {getCategoryBadge(test.category)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{test.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {test.duration && (
                            <span>Duration: {test.duration}s</span>
                          )}
                          {test.lastRun && (
                            <span>Last run: {new Date(test.lastRun).toLocaleString()}</span>
                          )}
                        </div>
                        {test.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertCircle className="h-3 w-3" />
                              <span className="font-medium">Error:</span>
                            </div>
                            {test.error}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          runTest(test.id)
                        }}
                        disabled={runningTests.has(test.id)}
                      >
                        {runningTests.has(test.id) ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Tabs>
    </div>
  )
}
