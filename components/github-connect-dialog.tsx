"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GitBranch,
  Github,
  Check,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FolderGit2,
  GitCommit,
  Shield,
  Link2,
  Smartphone,
  Folder,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { checkGitHubCloneAccess } from "@/app/actions/stripe"
import { StripeCheckoutDialog } from "./stripe-checkout-dialog"
import { Lock } from "lucide-react"

interface GitHubConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cuConfig: any
}

type ConnectionStep = "connect" | "select-repo" | "configure" | "connected"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  updated_at: string
  is_monorepo?: boolean
  packages?: string[]
}

export function GitHubConnectDialog({ open, onOpenChange, cuConfig }: GitHubConnectDialogProps) {
  const [step, setStep] = useState<ConnectionStep>("connect")
  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [branch, setBranch] = useState("main")
  const [configPath, setConfigPath] = useState("config/cu-config.json")
  const [connectionMode, setConnectionMode] = useState<"standard" | "monorepo" | "link">("standard")
  const [monorepoPath, setMonorepoPath] = useState("packages/flutter-app")
  const [repoUrl, setRepoUrl] = useState("")
  const [hasAccess, setHasAccess] = useState(false)
  const [planName, setPlanName] = useState<string>()
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [showStripeDialog, setShowStripeDialog] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      setCheckingAccess(true)
      const result = await checkGitHubCloneAccess()
      setHasAccess(result.hasAccess)
      setPlanName(result.planName)
      setCheckingAccess(false)
    }
    if (open) {
      checkAccess()
    }
  }, [open])

  const handleOpenDialog = () => {
    if (!hasAccess) {
      setShowStripeDialog(true)
      return
    }
    // Existing logic to open GitHub connect flow
  }

  const handleSubscriptionSuccess = async () => {
    setShowStripeDialog(false)
    // Recheck access
    const result = await checkGitHubCloneAccess()
    setHasAccess(result.hasAccess)
    setPlanName(result.planName)
  }

  // Simulated GitHub OAuth flow
  async function handleGitHubConnect() {
    setLoading(true)

    // In production, this would redirect to GitHub OAuth
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulated repos after OAuth - including monorepo examples
    setRepos([
      {
        id: 1,
        name: "cu-app-config",
        full_name: "navyfed/cu-app-config",
        private: true,
        default_branch: "main",
        updated_at: "2024-01-08",
      },
      {
        id: 2,
        name: "mobile-banking-flutter",
        full_name: "navyfed/mobile-banking-flutter",
        private: true,
        default_branch: "develop",
        updated_at: "2024-01-07",
      },
      {
        id: 3,
        name: "cu-monorepo",
        full_name: "navyfed/cu-monorepo",
        private: true,
        default_branch: "main",
        updated_at: "2024-01-09",
        is_monorepo: true,
        packages: ["packages/flutter-app", "packages/web-app", "packages/config", "packages/shared"],
      },
      {
        id: 4,
        name: "member-portal",
        full_name: "navyfed/member-portal",
        private: false,
        default_branch: "main",
        updated_at: "2024-01-05",
      },
    ])

    setStep("select-repo")
    setLoading(false)
  }

  async function handleLinkConnect() {
    if (!repoUrl) {
      toast.error("Please enter a repository URL")
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Parse the URL to extract repo info
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      toast.error("Invalid GitHub URL")
      setLoading(false)
      return
    }

    const [, owner, repoName] = match
    const fullName = `${owner}/${repoName.replace(".git", "")}`

    setSelectedRepo({
      id: Date.now(),
      name: repoName.replace(".git", ""),
      full_name: fullName,
      private: true,
      default_branch: "main",
      updated_at: new Date().toISOString(),
      is_monorepo: connectionMode === "monorepo",
    })

    setStep("configure")
    setLoading(false)
  }

  function handleSelectRepo(repo: GitHubRepo) {
    setSelectedRepo(repo)
    setBranch(repo.default_branch)
    if (repo.is_monorepo) {
      setConnectionMode("monorepo")
      setMonorepoPath(repo.packages?.[0] || "packages/flutter-app")
    }
    setStep("configure")
  }

  async function handleFinishSetup() {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStep("connected")
    setLoading(false)
    toast.success("GitHub connected successfully!")
  }

  async function handleSyncNow() {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
    toast.success("Configuration synced to GitHub!")
  }

  function resetAndClose() {
    setStep("connect")
    setSelectedRepo(null)
    setConnectionMode("standard")
    setRepoUrl("")
    onOpenChange(false)
  }

  function copyCloneCommand() {
    const cmd = selectedRepo
      ? `git clone git@github.com:${selectedRepo.full_name}.git && cd ${selectedRepo.name}${connectionMode === "monorepo" ? ` && cd ${monorepoPath}` : ""}`
      : ""
    navigator.clipboard.writeText(cmd)
    toast.success("Clone command copied!")
  }

  return (
    <>
      {!checkingAccess && !hasAccess && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-center">Upgrade to Clone to GitHub</DialogTitle>
              <DialogDescription className="text-center">
                GitHub clone and CI/CD features require an active subscription. Choose a plan to get started.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Button onClick={() => setShowStripeDialog(true)} className="w-full h-11">
                View Plans & Subscribe
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-11">
                Maybe Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!checkingAccess && hasAccess && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                {step === "connect" && "Connect to GitHub"}
                {step === "select-repo" && "Select Repository"}
                {step === "configure" && "Configure Sync"}
                {step === "connected" && "GitHub Connected"}
              </DialogTitle>
              <DialogDescription>
                {step === "connect" && "Sync your configuration to a GitHub repository for version control and CI/CD."}
                {step === "select-repo" && "Choose which repository to sync your configuration to."}
                {step === "configure" && "Set up how your configuration will be stored."}
                {step === "connected" && "Your configuration is now synced with GitHub."}
              </DialogDescription>
              {planName && (
                <Badge variant="outline" className="w-fit mx-auto">
                  Active Plan: {planName}
                </Badge>
              )}
            </DialogHeader>

            {/* Step 1: Connect */}
            {step === "connect" && (
              <div className="space-y-4 py-4">
                <Tabs value={connectionMode} onValueChange={(v) => setConnectionMode(v as typeof connectionMode)}>
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="standard" className="text-xs py-2">
                      <FolderGit2 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                      Standard
                    </TabsTrigger>
                    <TabsTrigger value="monorepo" className="text-xs py-2">
                      <Folder className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                      Monorepo
                    </TabsTrigger>
                    <TabsTrigger value="link" className="text-xs py-2">
                      <Link2 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                      Link URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="standard" className="mt-4 space-y-4">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Connect to a standard repository for config storage and CI/CD triggers.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      {[
                        { icon: Check, title: "Version Control", desc: "Every config change tracked with history" },
                        { icon: Check, title: "Auto Deployments", desc: "Push to GitHub triggers CI/CD" },
                        { icon: Check, title: "Team Collaboration", desc: "Review via pull requests" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                          <item.icon className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button onClick={handleGitHubConnect} className="w-full h-11" disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Github className="h-4 w-4 mr-2" />
                          Connect with GitHub
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="monorepo" className="mt-4 space-y-4">
                    <Alert>
                      <Folder className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Connect to a monorepo and specify the Flutter app package path.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <Smartphone className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Flutter Preview Link</p>
                          <p className="text-xs text-muted-foreground">
                            Wire the Flutter preview directly to your monorepo package
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <GitBranch className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Selective Sync</p>
                          <p className="text-xs text-muted-foreground">
                            Only sync config changes to the relevant package
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleGitHubConnect} className="w-full h-11" disabled={loading}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Github className="h-4 w-4 mr-2" />
                          Connect Monorepo
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="link" className="mt-4 space-y-4">
                    <Alert>
                      <Link2 className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Paste a GitHub repository URL to connect directly without OAuth.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="repo-url" className="text-sm">
                          Repository URL
                        </Label>
                        <Input
                          id="repo-url"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder="https://github.com/org/repo"
                          className="mt-1.5 h-11"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports: github.com/owner/repo or github.com/owner/repo.git
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is-monorepo"
                          checked={connectionMode === "monorepo"}
                          onChange={(e) => setConnectionMode(e.target.checked ? "monorepo" : "link")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="is-monorepo" className="text-sm">
                          This is a monorepo
                        </Label>
                      </div>
                    </div>

                    <Button onClick={handleLinkConnect} className="w-full h-11" disabled={loading || !repoUrl}>
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          Connect via Link
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>

                <p className="text-xs text-center text-muted-foreground">
                  {connectionMode === "link"
                    ? "You may need to add a deploy key for private repos"
                    : "You'll be redirected to GitHub to authorize access"}
                </p>
              </div>
            )}

            {/* Step 2: Select Repository */}
            {step === "select-repo" && (
              <div className="space-y-4 py-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {repos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleSelectRepo(repo)}
                        className="w-full text-left p-3 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderGit2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{repo.name}</span>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Private
                              </Badge>
                            )}
                            {repo.is_monorepo && (
                              <Badge variant="outline" className="text-xs shrink-0 border-blue-300 text-blue-600">
                                Monorepo
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            <GitBranch className="h-3 w-3 mr-1" />
                            {repo.default_branch}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{repo.full_name}</p>
                        {repo.is_monorepo && repo.packages && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {repo.packages.slice(0, 3).map((pkg) => (
                              <Badge key={pkg} variant="secondary" className="text-[10px]">
                                {pkg}
                              </Badge>
                            ))}
                            {repo.packages.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{repo.packages.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <Button variant="outline" className="w-full h-11 bg-transparent" onClick={() => setStep("connect")}>
                  Back
                </Button>
              </div>
            )}

            {/* Step 3: Configure */}
            {step === "configure" && selectedRepo && (
              <div className="space-y-4 py-4">
                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4 shrink-0" />
                    <span className="font-medium truncate">{selectedRepo.full_name}</span>
                    {selectedRepo.is_monorepo && (
                      <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 shrink-0">
                        Monorepo
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <p className="text-xs text-muted-foreground mb-1.5">Which branch should we sync to?</p>
                    <Input
                      id="branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="h-11"
                    />
                  </div>

                  {(connectionMode === "monorepo" || selectedRepo.is_monorepo) && (
                    <div>
                      <Label htmlFor="monorepo-path">Flutter Package Path</Label>
                      <p className="text-xs text-muted-foreground mb-1.5">
                        Path to the Flutter app within the monorepo
                      </p>
                      {selectedRepo.packages ? (
                        <select
                          id="monorepo-path"
                          value={monorepoPath}
                          onChange={(e) => setMonorepoPath(e.target.value)}
                          className="w-full h-11 px-3 border rounded-md bg-background text-sm"
                        >
                          {selectedRepo.packages.map((pkg) => (
                            <option key={pkg} value={pkg}>
                              {pkg}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id="monorepo-path"
                          value={monorepoPath}
                          onChange={(e) => setMonorepoPath(e.target.value)}
                          placeholder="packages/flutter-app"
                          className="h-11"
                        />
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="path">Config File Path</Label>
                    <p className="text-xs text-muted-foreground mb-1.5">Where should we save the configuration JSON?</p>
                    <Input
                      id="path"
                      value={configPath}
                      onChange={(e) => setConfigPath(e.target.value)}
                      placeholder="config/cu-config.json"
                      className="h-11"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Config changes will commit to <code className="bg-muted px-1 rounded">{branch}</code>
                    {(connectionMode === "monorepo" || selectedRepo.is_monorepo) && (
                      <>
                        {" "}
                        in <code className="bg-muted px-1 rounded">{monorepoPath}</code>
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("select-repo")} className="flex-1 h-11">
                    Back
                  </Button>
                  <Button onClick={handleFinishSetup} className="flex-1 h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Finish Setup"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Connected */}
            {step === "connected" && selectedRepo && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-center py-6">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="font-semibold">Successfully Connected!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your configuration will sync to GitHub automatically.
                  </p>
                </div>

                <div className="p-3 border rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Repository</span>
                    <span className="font-medium truncate ml-2">{selectedRepo.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Branch</span>
                    <span className="font-medium">{branch}</span>
                  </div>
                  {(connectionMode === "monorepo" || selectedRepo.is_monorepo) && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Package</span>
                      <span className="font-mono text-xs">{monorepoPath}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Config Path</span>
                    <span className="font-mono text-xs">{configPath}</span>
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Clone Command</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={copyCloneCommand}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <code className="text-xs font-mono text-muted-foreground break-all">
                    git clone git@github.com:{selectedRepo.full_name}.git
                    {(connectionMode === "monorepo" || selectedRepo.is_monorepo) &&
                      ` && cd ${selectedRepo.name} && cd ${monorepoPath}`}
                  </code>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex-1 h-11 bg-transparent" asChild>
                    <a href={`https://github.com/${selectedRepo.full_name}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on GitHub
                    </a>
                  </Button>
                  <Button onClick={handleSyncNow} className="flex-1 h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <GitCommit className="h-4 w-4 mr-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>

                <Button variant="ghost" className="w-full h-11" onClick={resetAndClose}>
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <StripeCheckoutDialog
        open={showStripeDialog}
        onOpenChange={setShowStripeDialog}
        onSuccess={handleSubscriptionSuccess}
      />
    </>
  )
}
