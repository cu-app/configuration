"use client"

import { useState, useMemo } from "react"
import type { CreditUnionData } from "@/lib/credit-union-data"
import type { CreditUnionConfig } from "@/types/cu-config"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Lock, Play, Eye, Code, ChevronRight, ChevronDown, FileCode, File, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEFAULT_CU_CONFIG } from "@/lib/cu-config-defaults"
import { IPhoneDeviceFrame } from "./iphone-device-frame"
import { PurchaseDialog } from "./purchase-dialog"
import { ADMIN_EMAILS } from "@/lib/products"

interface FlutterPreviewUnifiedProps {
  cu: CreditUnionData
  config?: CreditUnionConfig
  userEmail?: string
}

type FileNode = {
  name: string
  type: "file" | "folder"
  locked?: boolean
  children?: FileNode[]
}

const FILE_TREE: FileNode[] = [
  {
    name: "lib",
    type: "folder",
    children: [
      { name: "main.dart", type: "file" },
      {
        name: "config",
        type: "folder",
        children: [
          { name: "theme.dart", type: "file" },
          { name: "branding.dart", type: "file" },
          { name: "features.dart", type: "file" },
          { name: "routes.dart", type: "file" },
        ],
      },
      {
        name: "providers",
        type: "folder",
        children: [
          { name: "auth_provider.dart", type: "file" },
          { name: "account_provider.dart", type: "file" },
          { name: "transaction_provider.dart", type: "file" },
        ],
      },
      {
        name: "screens",
        type: "folder",
        children: [
          { name: "splash_screen.dart", type: "file" },
          { name: "home_screen.dart", type: "file" },
          { name: "accounts_screen.dart", type: "file" },
        ],
      },
      {
        name: "widgets",
        type: "folder",
        children: [
          { name: "cu_logo.dart", type: "file" },
          { name: "balance_card.dart", type: "file" },
        ],
      },
    ],
  },
  { name: "pubspec.yaml", type: "file" },
  { name: "flutter_native_splash.yaml", type: "file" },
]

function FileTreeItem({
  node,
  depth = 0,
  selectedFile,
  onSelect,
  expanded,
  onToggle,
  isPurchased,
}: {
  node: FileNode
  depth?: number
  selectedFile: string
  onSelect: (path: string) => void
  expanded: Record<string, boolean>
  onToggle: (path: string) => void
  isPurchased: boolean
}) {
  const isFolder = node.type === "folder"
  const isExpanded = expanded[node.name]

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded cursor-pointer text-xs hover:bg-muted/50",
          selectedFile === node.name && "bg-primary/10 text-primary",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => (isFolder ? onToggle(node.name) : onSelect(node.name))}
      >
        {isFolder ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )
        ) : (
          <span className="w-3" />
        )}
        {isFolder ? (
          <Folder className="h-3.5 w-3.5 text-yellow-500" />
        ) : node.name.endsWith(".dart") ? (
          <FileCode className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <File className="h-3.5 w-3.5 text-purple-500" />
        )}
        <span className="truncate flex-1">{node.name}</span>
        {!isPurchased && !isFolder && <Lock className="h-3 w-3 text-amber-500" />}
      </div>
      {isFolder &&
        isExpanded &&
        node.children?.map((child) => (
          <FileTreeItem
            key={child.name}
            node={child}
            depth={depth + 1}
            selectedFile={selectedFile}
            onSelect={onSelect}
            expanded={expanded}
            onToggle={onToggle}
            isPurchased={isPurchased}
          />
        ))}
    </div>
  )
}

export function FlutterPreviewUnified({ cu, config, userEmail }: FlutterPreviewUnifiedProps) {
  const [selectedFile, setSelectedFile] = useState("main.dart")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ lib: true, config: true })
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [showSplash, setShowSplash] = useState(true)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [isPurchased, setIsPurchased] = useState(false)

  // Check if admin or purchased
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())
  const hasAccess = isAdmin || isPurchased

  const c = config || DEFAULT_CU_CONFIG

  // Generate code based on selected file
  const generatedCode = useMemo(() => {
    const primaryHex = cu.primaryColor.replace("#", "0xFF")

    if (selectedFile === "main.dart") {
      return `// ${cu.displayName.toUpperCase()} MOBILE BANKING APP
// Generated by CU.APP Configuration Matrix
// Charter #${cu.charter} | Routing #${cu.routing}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/theme.dart';
import 'config/branding.dart';
import 'config/routes.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  
  runApp(const ProviderScope(child: CUMobileApp()));
}

class CUMobileApp extends ConsumerWidget {
  const CUMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    
    return MaterialApp.router(
      title: BrandingConfig.cuName,
      debugShowCheckedModeBanner: false,
      theme: CUTheme.lightTheme,
      darkTheme: CUTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}`
    }

    if (selectedFile === "splash_screen.dart") {
      return `// ${cu.displayName} Splash Screen
// WHITE BACKGROUND with tenant logo

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/branding.dart';
import '../widgets/cu_logo.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward();
    
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) context.go('/home');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // WHITE BACKGROUND
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ScaleTransition(
              scale: _scaleAnimation,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: BrandingConfig.primaryColor,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: BrandingConfig.primaryColor.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const CULogo(size: 80, inverted: true),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              BrandingConfig.cuName,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: BrandingConfig.primaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Mobile Banking',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor: AlwaysStoppedAnimation<Color>(
                  BrandingConfig.primaryColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}`
    }

    if (selectedFile === "branding.dart") {
      return `// ${cu.displayName} Branding Configuration
// Auto-generated from CU.APP Configuration Matrix

import 'package:flutter/material.dart';

class BrandingConfig {
  static const String cuName = '${cu.displayName}';
  static const String cuCharter = '${cu.charter}';
  static const String cuRouting = '${cu.routing}';
  
  static const Color primaryColor = Color(${primaryHex});
  
  // Logo URLs with fallback chain
  static const String logoUrlDirect = '${cu.logoUrls?.direct || ""}';
  static const String logoUrlBrandfetch = '${cu.logoUrls?.brandfetch || ""}';
  static const String logoUrlClearbit = '${cu.logoUrls?.clearbit || ""}';
  static const String logoUrlGoogle = '${cu.logoUrls?.google || ""}';
  
  static List<String> get logoFallbackChain => [
    logoUrlDirect,
    logoUrlBrandfetch,
    logoUrlClearbit,
    logoUrlGoogle,
  ].where((url) => url.isNotEmpty).toList();
}`
    }

    if (selectedFile === "routes.dart") {
      return `// ${cu.displayName} GoRouter Configuration
// Riverpod-powered navigation

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../screens/splash_screen.dart';
import '../screens/home_screen.dart';
import '../screens/accounts_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/accounts',
        builder: (context, state) => const AccountsScreen(),
      ),
    ],
  );
});`
    }

    return `// Select a file to view its contents`
  }, [selectedFile, cu, c])

  function handleCopy() {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleToggle(path: string) {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  function handlePlaySplash() {
    setShowSplash(true)
    setViewMode("preview")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: cu.primaryColor }}
          >
            {cu.logoUrls?.clearbit ? (
              <img
                src={cu.logoUrls.clearbit || "/placeholder.svg"}
                alt={cu.displayName}
                className="w-6 h-6 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            ) : (
              <span className="text-white font-bold text-sm">{cu.displayName.substring(0, 2)}</span>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{cu.displayName} Mobile App</h2>
            <p className="text-xs text-muted-foreground">Flutter • Riverpod • GoRouter • Material Design</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "preview" | "code")}>
            <TabsList className="h-8">
              <TabsTrigger value="preview" className="text-xs gap-1 h-6 px-3">
                <Eye className="h-3 w-3" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs gap-1 h-6 px-3">
                <Code className="h-3 w-3" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" className="h-8 gap-1 bg-transparent" onClick={handlePlaySplash}>
            <Play className="h-3 w-3" />
            Run Splash
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === "preview" ? (
          /* Preview Mode - iPhone with real app */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-8">
            <IPhoneDeviceFrame cu={cu} showSplash={showSplash} />
          </div>
        ) : (
          /* Code Mode - File tree + Code viewer */
          <>
            {/* File Tree */}
            <div className="w-56 border-r bg-card">
              <div className="p-2 border-b">
                <p className="text-xs font-medium text-muted-foreground">
                  {cu.displayName.toLowerCase().replace(/\s+/g, "_")}_mobile
                </p>
              </div>
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="p-1">
                  {FILE_TREE.map((node) => (
                    <FileTreeItem
                      key={node.name}
                      node={node}
                      selectedFile={selectedFile}
                      onSelect={setSelectedFile}
                      expanded={expanded}
                      onToggle={handleToggle}
                      isPurchased={hasAccess}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 flex flex-col relative">
              {/* Code Header */}
              <div className="h-10 border-b flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    lib/{selectedFile}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={handleCopy} disabled={!hasAccess}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              {/* Code Content with Blur Overlay */}
              <div className="flex-1 relative overflow-hidden">
                <ScrollArea className="h-full">
                  <pre className={cn("p-4 text-xs font-mono leading-relaxed", !hasAccess && "select-none")}>
                    <code>{generatedCode}</code>
                  </pre>
                </ScrollArea>

                {/* Blur Paywall Overlay */}
                {!hasAccess && (
                  <div className="absolute inset-0 backdrop-blur-md bg-background/60 flex flex-col items-center justify-center">
                    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Source Code Locked</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                      Purchase the complete source code package to unlock full access
                    </p>
                    <Button onClick={() => setPurchaseOpen(true)}>Unlock for $50,000</Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <PurchaseDialog
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        creditUnionName={cu.displayName}
        userEmail={userEmail}
        onPurchaseSuccess={() => setIsPurchased(true)}
      />
    </div>
  )
}
