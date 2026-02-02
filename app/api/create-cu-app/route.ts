import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/create-cu-app
 *
 * Creates a complete Flutter app repository for any credit union.
 * This is the "proof" that 4,300 CU apps are achievable.
 *
 * Flow:
 * 1. Fetch CU data from Supabase (NCUA data, logos, branches)
 * 2. Generate cu_ui-based Flutter app code
 * 3. Generate config.json with all mappable fields
 * 4. Create GitHub repo with template + config
 * 5. Return repo URL for CU to fork
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const { charterId } = await req.json()

    if (!charterId) {
      return NextResponse.json({ error: 'charterId is required' }, { status: 400 })
    }

    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 })
    }

    // 1. Fetch CU data from Supabase
    const supabase = await createClient()

    const { data: cu, error: cuError } = await supabase
      .from('credit_unions')
      .select('*')
      .eq('charter', charterId)
      .single()

    if (cuError || !cu) {
      return NextResponse.json({ error: `Credit union ${charterId} not found` }, { status: 404 })
    }

    // 2. Fetch any existing config
    const { data: existingConfig } = await supabase
      .from('cu_configs')
      .select('config')
      .eq('charter_number', charterId)
      .single()

    // 3. Fetch discovered branches
    const { data: branches } = await supabase
      .from('discovered_items')
      .select('*')
      .eq('credit_union_id', cu.id)
      .eq('item_type', 'branch')
      .eq('verification_status', 'verified')
      .limit(20)

    // 4. Build the complete CU profile
    const cuProfile = buildCUProfile(cu, existingConfig?.config, branches || [])

    // 5. Generate all the files
    const files = generateFlutterApp(cuProfile)

    // 6. Create GitHub repo
    const repoResult = await createGitHubRepo(githubToken, cuProfile, files)

    if (!repoResult.success) {
      return NextResponse.json({ error: repoResult.error }, { status: 500 })
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      creditUnion: {
        name: cuProfile.name,
        charter: cuProfile.charter,
        state: cuProfile.state,
        members: cuProfile.members,
        assets: cuProfile.assets,
      },
      repo: {
        url: repoResult.repoUrl,
        name: repoResult.repoName,
        cloneUrl: `${repoResult.repoUrl}.git`,
      },
      files: Object.keys(files).length,
      duration_ms: duration,
      next_steps: [
        '1. Fork the repository to your GitHub account',
        '2. Add your OAuth credentials to lib/config/credentials.dart',
        '3. Add your SymXChange connection details',
        '4. Run: flutter pub get && flutter run',
        '5. Build for production: flutter build ios && flutter build appbundle',
      ],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[create-cu-app] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface CUProfile {
  // Identity
  id: string
  name: string
  displayName: string
  charter: string
  routing: string
  state: string
  city: string

  // Size
  members: number
  assets: number
  assetsFormatted: string

  // Branding
  primaryColor: string
  logoUrl: string
  logoUrls: {
    clearbit?: string
    brandfetch?: string
    google?: string
  }
  website: string

  // Contact
  phone: string

  // Branches
  branches: Array<{
    name: string
    address: string
    lat: number
    lng: number
  }>

  // Config (from dashboard)
  features: Record<string, boolean>
  products: {
    checking: boolean
    savings: boolean
    moneyMarket: boolean
    certificates: boolean
    autoLoans: boolean
    mortgages: boolean
    creditCards: boolean
  }
}

function buildCUProfile(cu: any, config: any, branches: any[]): CUProfile {
  const domain = cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]

  return {
    id: cu.id,
    name: cu.name || cu.cu_name,
    displayName: cu.display_name || cu.name || cu.cu_name,
    charter: cu.charter?.toString() || '',
    routing: cu.routing_number || '',
    state: cu.state || '',
    city: cu.city || cu.headquarters?.split(',')[0] || '',

    members: cu.members || cu.total_members || 0,
    assets: cu.assets || cu.total_assets || 0,
    assetsFormatted: formatAssets(cu.assets || cu.total_assets || 0),

    primaryColor: cu.primary_color || config?.design_tokens?.color?.primary || '#1e3a8a',
    logoUrl: cu.logo_url || cu.logo_urls?.clearbit || `https://logo.clearbit.com/${domain}`,
    logoUrls: {
      clearbit: `https://logo.clearbit.com/${domain}`,
      brandfetch: cu.logo_urls?.brandfetch,
      google: cu.logo_urls?.google,
    },
    website: cu.website || `https://www.${domain}`,

    phone: cu.phone || config?.tenant?.support?.phone || '',

    branches: branches.map(b => ({
      name: b.raw_data?.name || b.name || 'Branch',
      address: b.raw_data?.address || b.address || '',
      lat: b.raw_data?.location?.lat || 0,
      lng: b.raw_data?.location?.lng || 0,
    })),

    features: config?.features || {
      mobile_deposit: true,
      bill_pay: true,
      p2p: true,
      wire_transfer: false,
      card_controls: true,
      face_id: true,
      fingerprint: true,
      dark_mode: true,
    },

    products: {
      checking: true,
      savings: true,
      moneyMarket: true,
      certificates: true,
      autoLoans: true,
      mortgages: true,
      creditCards: true,
    },
  }
}

function formatAssets(assets: number): string {
  if (assets >= 1e9) return `$${(assets / 1e9).toFixed(1)}B`
  if (assets >= 1e6) return `$${(assets / 1e6).toFixed(0)}M`
  return `$${assets.toLocaleString()}`
}

function generateFlutterApp(cu: CUProfile): Record<string, string> {
  const files: Record<string, string> = {}

  // pubspec.yaml
  files['pubspec.yaml'] = generatePubspec(cu)

  // Main entry point
  files['lib/main.dart'] = generateMainDart(cu)

  // Config
  files['lib/config/cu_config.dart'] = generateCUConfig(cu)
  files['lib/config/credentials.dart'] = generateCredentialsTemplate()
  files['lib/config/features.dart'] = generateFeaturesConfig(cu)

  // Theme
  files['lib/theme/cu_theme.dart'] = generateTheme(cu)

  // Screens
  files['lib/screens/splash_screen.dart'] = generateSplashScreen(cu)
  files['lib/screens/login_screen.dart'] = generateLoginScreen(cu)
  files['lib/screens/home_screen.dart'] = generateHomeScreen(cu)
  files['lib/screens/accounts_screen.dart'] = generateAccountsScreen(cu)
  files['lib/screens/transfers_screen.dart'] = generateTransfersScreen(cu)
  files['lib/screens/settings_screen.dart'] = generateSettingsScreen(cu)

  // Widgets
  files['lib/widgets/cu_button.dart'] = generateCUButton()
  files['lib/widgets/cu_card.dart'] = generateCUCard()
  files['lib/widgets/cu_input.dart'] = generateCUInput()
  files['lib/widgets/account_tile.dart'] = generateAccountTile()

  // Services
  files['lib/services/auth_service.dart'] = generateAuthService()
  files['lib/services/api_service.dart'] = generateAPIService()

  // Models
  files['lib/models/account.dart'] = generateAccountModel()
  files['lib/models/transaction.dart'] = generateTransactionModel()

  // Config JSON (for runtime)
  files['assets/config/cu_config.json'] = JSON.stringify(generateConfigJSON(cu), null, 2)

  // README
  files['README.md'] = generateReadme(cu)

  // GitHub Actions
  files['.github/workflows/build.yml'] = generateGitHubActions(cu)

  return files
}

function generatePubspec(cu: CUProfile): string {
  return `name: ${cu.charter}_mobile_app
description: ${cu.displayName} Mobile Banking App - Powered by CU.APP
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: '>=3.16.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3

  # Routing
  go_router: ^13.0.0

  # Networking
  dio: ^5.4.0

  # Storage
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0

  # UI
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0

  # Biometrics
  local_auth: ^2.1.8

  # Utils
  intl: ^0.19.0
  url_launcher: ^6.2.2
  package_info_plus: ^5.0.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  riverpod_generator: ^2.3.9
  build_runner: ^2.4.8

flutter:
  uses-material-design: true

  assets:
    - assets/config/
    - assets/images/

  fonts:
    - family: CUFont
      fonts:
        - asset: assets/fonts/Inter-Regular.ttf
        - asset: assets/fonts/Inter-Medium.ttf
          weight: 500
        - asset: assets/fonts/Inter-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Inter-Bold.ttf
          weight: 700
`
}

function generateMainDart(cu: CUProfile): string {
  return `// ${cu.displayName} Mobile Banking App
// Charter #${cu.charter} | Generated by CU.APP
// https://cu.app

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/cu_config.dart';
import 'theme/cu_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load configuration
  await CUConfig.initialize();

  // Set system UI style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    const ProviderScope(
      child: CUMobileApp(),
    ),
  );
}

class CUMobileApp extends ConsumerWidget {
  const CUMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: '${cu.displayName}',
      debugShowCheckedModeBanner: false,
      theme: CUTheme.light(),
      darkTheme: CUTheme.dark(),
      themeMode: ThemeMode.system,
      home: const AppNavigator(),
    );
  }
}

class AppNavigator extends StatefulWidget {
  const AppNavigator({super.key});

  @override
  State<AppNavigator> createState() => _AppNavigatorState();
}

class _AppNavigatorState extends State<AppNavigator> {
  int _currentScreen = 0;

  void _navigateTo(int screen) {
    setState(() => _currentScreen = screen);
  }

  @override
  Widget build(BuildContext context) {
    return switch (_currentScreen) {
      0 => SplashScreen(onComplete: () => _navigateTo(1)),
      1 => LoginScreen(onLogin: () => _navigateTo(2)),
      _ => const HomeScreen(),
    };
  }
}
`
}

function generateCUConfig(cu: CUProfile): string {
  return `// Credit Union Configuration
// Auto-generated from CU.APP Dashboard

import 'dart:convert';
import 'package:flutter/services.dart';

class CUConfig {
  static late Map<String, dynamic> _config;

  // Identity
  static String get name => _config['name'] ?? '${cu.displayName}';
  static String get charter => _config['charter'] ?? '${cu.charter}';
  static String get routing => _config['routing'] ?? '${cu.routing}';
  static String get state => _config['state'] ?? '${cu.state}';

  // Branding
  static String get primaryColorHex => _config['primaryColor'] ?? '${cu.primaryColor}';
  static String get logoUrl => _config['logoUrl'] ?? '${cu.logoUrl}';
  static String get website => _config['website'] ?? '${cu.website}';

  // Contact
  static String get supportPhone => _config['phone'] ?? '${cu.phone}';

  // Stats
  static int get memberCount => _config['members'] ?? ${cu.members};
  static String get assetsFormatted => _config['assetsFormatted'] ?? '${cu.assetsFormatted}';

  // Features
  static bool get mobileDepositEnabled => _config['features']?['mobile_deposit'] ?? true;
  static bool get billPayEnabled => _config['features']?['bill_pay'] ?? true;
  static bool get p2pEnabled => _config['features']?['p2p'] ?? true;
  static bool get cardControlsEnabled => _config['features']?['card_controls'] ?? true;
  static bool get biometricsEnabled => _config['features']?['face_id'] ?? true;

  static Future<void> initialize() async {
    try {
      final jsonString = await rootBundle.loadString('assets/config/cu_config.json');
      _config = json.decode(jsonString);
    } catch (e) {
      _config = {};
    }
  }
}
`
}

function generateCredentialsTemplate(): string {
  return `// ⚠️ CREDENTIALS TEMPLATE
// Replace these values with your credit union's actual credentials
// DO NOT commit real credentials to source control

class CUCredentials {
  // OAuth / Identity Provider
  static const String authBaseUrl = 'https://YOUR_AUTH_DOMAIN.com';
  static const String clientId = 'YOUR_CLIENT_ID';
  static const String clientSecret = 'YOUR_CLIENT_SECRET';
  static const String redirectUri = 'com.yourcu.app://callback';

  // API Gateway
  static const String apiBaseUrl = 'https://api.YOUR_DOMAIN.com';
  static const String apiKey = 'YOUR_API_KEY';

  // SymXChange / Core Banking Connection
  static const String symxHostIp = '10.0.0.1';  // Your Symitar host
  static const int symxHostPort = 443;
  static const int symxDeviceNumber = 1;
  static const String symxDeviceType = 'APP';
  static const String symxProcessorUser = 'MOBILEAPP';

  // Push Notifications
  static const String firebaseProjectId = 'YOUR_FIREBASE_PROJECT';

  // Analytics (optional)
  static const String mixpanelToken = '';
  static const String amplitudeApiKey = '';
}
`
}

function generateFeaturesConfig(cu: CUProfile): string {
  return `// Feature Flags Configuration
// Toggle features on/off per credit union

class CUFeatures {
  // Account Features
  static const bool mobileDeposit = ${cu.features.mobile_deposit ?? true};
  static const bool billPay = ${cu.features.bill_pay ?? true};
  static const bool p2p = ${cu.features.p2p ?? true};
  static const bool wireTransfer = ${cu.features.wire_transfer ?? false};
  static const bool externalTransfers = true;

  // Card Features
  static const bool cardControls = ${cu.features.card_controls ?? true};
  static const bool travelNotifications = true;
  static const bool instantCardLock = true;

  // Security Features
  static const bool faceId = ${cu.features.face_id ?? true};
  static const bool fingerprint = ${cu.features.fingerprint ?? true};
  static const bool voiceBiometrics = false;

  // UI Features
  static const bool darkMode = ${cu.features.dark_mode ?? true};
  static const bool quickBalance = true;
  static const bool budgeting = true;
  static const bool goals = true;

  // Products Available
  static const bool checking = ${cu.products.checking};
  static const bool savings = ${cu.products.savings};
  static const bool moneyMarket = ${cu.products.moneyMarket};
  static const bool certificates = ${cu.products.certificates};
  static const bool autoLoans = ${cu.products.autoLoans};
  static const bool mortgages = ${cu.products.mortgages};
  static const bool creditCards = ${cu.products.creditCards};
}
`
}

function generateTheme(cu: CUProfile): string {
  // Convert hex to RGB for Dart
  const hex = cu.primaryColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `// ${cu.displayName} Theme
// Primary Color: ${cu.primaryColor}

import 'package:flutter/material.dart';

class CUTheme {
  // Brand Colors
  static const Color primary = Color(0xFF${hex.toUpperCase()});
  static const Color primaryLight = Color.fromRGBO(${r}, ${g}, ${b}, 0.1);
  static const Color primaryDark = Color.fromRGBO(${Math.max(0, r-30)}, ${Math.max(0, g-30)}, ${Math.max(0, b-30)}, 1);

  // Semantic Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Neutrals
  static const Color background = Color(0xFFF9FAFB);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE5E7EB);
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.light(
        primary: primary,
        secondary: primaryLight,
        surface: surface,
        background: background,
        error: error,
      ),
      scaffoldBackgroundColor: background,
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: CardTheme(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: border),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF3F4F6),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
      ),
      fontFamily: 'CUFont',
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: primary,
        secondary: primaryLight,
        surface: const Color(0xFF1F2937),
        background: const Color(0xFF111827),
        error: error,
      ),
      scaffoldBackgroundColor: const Color(0xFF111827),
      fontFamily: 'CUFont',
    );
  }
}
`
}

function generateSplashScreen(cu: CUProfile): string {
  return `import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/cu_config.dart';
import '../theme/cu_theme.dart';

class SplashScreen extends StatefulWidget {
  final VoidCallback onComplete;

  const SplashScreen({super.key, required this.onComplete});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );

    _controller.forward();

    Future.delayed(const Duration(seconds: 2), widget.onComplete);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Opacity(
              opacity: _fadeAnimation.value,
              child: Transform.scale(
                scale: _scaleAnimation.value,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Logo
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: CUTheme.primary,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: CUTheme.primary.withOpacity(0.3),
                            blurRadius: 30,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: CachedNetworkImage(
                          imageUrl: CUConfig.logoUrl,
                          color: Colors.white,
                          colorBlendMode: BlendMode.srcIn,
                          fit: BoxFit.contain,
                          width: 60,
                          height: 60,
                          errorWidget: (_, __, ___) => const Icon(
                            Icons.account_balance,
                            color: Colors.white,
                            size: 48,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Name
                    Text(
                      CUConfig.name,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: CUTheme.textPrimary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),

                    // Tagline
                    const Text(
                      'Mobile Banking',
                      style: TextStyle(
                        fontSize: 14,
                        letterSpacing: 2,
                        color: CUTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Loading
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: CUTheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
`
}

function generateLoginScreen(cu: CUProfile): string {
  return `import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/cu_config.dart';
import '../config/features.dart';
import '../theme/cu_theme.dart';
import '../widgets/cu_button.dart';
import '../widgets/cu_input.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLogin;

  const LoginScreen({super.key, required this.onLogin});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);

    // Simulate login
    await Future.delayed(const Duration(milliseconds: 800));

    if (mounted) {
      setState(() => _isLoading = false);
      widget.onLogin();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),

              // Logo
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: CUTheme.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: CUConfig.logoUrl,
                    color: Colors.white,
                    colorBlendMode: BlendMode.srcIn,
                    width: 40,
                    height: 40,
                    errorWidget: (_, __, ___) => const Icon(
                      Icons.account_balance,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Title
              Text(
                'Welcome Back',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in to your \${CUConfig.name} account',
                style: TextStyle(color: CUTheme.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Form
              CUInput(
                label: 'Username',
                hint: 'Enter your username',
                controller: _usernameController,
              ),
              const SizedBox(height: 16),
              CUInput(
                label: 'Password',
                hint: 'Enter your password',
                controller: _passwordController,
                obscure: true,
              ),

              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {},
                  child: Text(
                    'Forgot Password?',
                    style: TextStyle(color: CUTheme.textSecondary, fontSize: 12),
                  ),
                ),
              ),

              const SizedBox(height: 16),
              CUButton(
                label: 'Sign In',
                onPressed: _handleLogin,
                isLoading: _isLoading,
              ),

              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Don't have an account? ",
                    style: TextStyle(color: CUTheme.textSecondary),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: Text(
                      'Enroll Now',
                      style: TextStyle(
                        color: CUTheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              // Biometrics
              if (CUFeatures.faceId || CUFeatures.fingerprint) ...[
                const SizedBox(height: 48),
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: CUTheme.border,
                            width: 2,
                          ),
                        ),
                        child: Icon(
                          CUFeatures.faceId ? Icons.face : Icons.fingerprint,
                          color: CUTheme.textSecondary,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        CUFeatures.faceId ? 'Use Face ID' : 'Use Fingerprint',
                        style: const TextStyle(
                          fontSize: 12,
                          color: CUTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
`
}

function generateHomeScreen(cu: CUProfile): string {
  return `import 'package:flutter/material.dart';
import '../config/cu_config.dart';
import '../theme/cu_theme.dart';
import '../widgets/account_tile.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CUTheme.background,
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 60, 20, 24),
              decoration: BoxDecoration(
                color: CUTheme.primary,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(24),
                ),
              ),
              child: Column(
                children: [
                  // Greeting
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.white24,
                        child: const Text(
                          'JD',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _greeting,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white70,
                              ),
                            ),
                            const Text(
                              'John Doe',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(
                          Icons.notifications_outlined,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Balance Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total Balance',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '\$18,322.55',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Quick Actions
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _QuickAction(Icons.send, 'Transfer'),
                      _QuickAction(Icons.payment, 'Pay'),
                      _QuickAction(Icons.add_circle_outline, 'Deposit'),
                      _QuickAction(Icons.more_horiz, 'More'),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Accounts Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'My Accounts',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

          SliverList(
            delegate: SliverChildListDelegate([
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: AccountTile(
                  name: 'Checking',
                  number: '****1234',
                  balance: 5432.10,
                  icon: Icons.account_balance_wallet,
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: AccountTile(
                  name: 'Savings',
                  number: '****5678',
                  balance: 12890.45,
                  icon: Icons.savings,
                ),
              ),
              const SizedBox(height: 100),
            ]),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: CUTheme.primary,
        unselectedItemColor: CUTheme.textTertiary,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.credit_card), label: 'Cards'),
          BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'Activity'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;

  const _QuickAction(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: CUTheme.primaryLight,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: CUTheme.primary),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }
}
`
}

function generateAccountsScreen(_cu: CUProfile): string {
  return `import 'package:flutter/material.dart';
import '../theme/cu_theme.dart';

class AccountsScreen extends StatelessWidget {
  const AccountsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Accounts'),
      ),
      body: const Center(
        child: Text('Accounts Screen'),
      ),
    );
  }
}
`
}

function generateTransfersScreen(_cu: CUProfile): string {
  return `import 'package:flutter/material.dart';

class TransfersScreen extends StatelessWidget {
  const TransfersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transfers'),
      ),
      body: const Center(
        child: Text('Transfers Screen'),
      ),
    );
  }
}
`
}

function generateSettingsScreen(_cu: CUProfile): string {
  return `import 'package:flutter/material.dart';
import '../config/cu_config.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          ListTile(
            title: Text(CUConfig.name),
            subtitle: Text('Charter #\${CUConfig.charter}'),
            leading: const Icon(Icons.account_balance),
          ),
        ],
      ),
    );
  }
}
`
}

function generateCUButton(): string {
  return `import 'package:flutter/material.dart';
import '../theme/cu_theme.dart';

class CUButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;

  const CUButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isOutlined) {
      return OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(double.infinity, 48),
          side: BorderSide(color: CUTheme.primary),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(label),
      );
    }

    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Text(label),
    );
  }
}
`
}

function generateCUCard(): string {
  return `import 'package:flutter/material.dart';
import '../theme/cu_theme.dart';

class CUCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final VoidCallback? onTap;

  const CUCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: padding ?? const EdgeInsets.all(16),
          child: child,
        ),
      ),
    );
  }
}
`
}

function generateCUInput(): string {
  return `import 'package:flutter/material.dart';

class CUInput extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscure;
  final TextInputType? keyboardType;

  const CUInput({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.obscure = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
          ),
        ),
      ],
    );
  }
}
`
}

function generateAccountTile(): string {
  return `import 'package:flutter/material.dart';
import '../theme/cu_theme.dart';

class AccountTile extends StatelessWidget {
  final String name;
  final String number;
  final double balance;
  final IconData icon;
  final VoidCallback? onTap;

  const AccountTile({
    super.key,
    required this.name,
    required this.number,
    required this.balance,
    required this.icon,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: CUTheme.primaryLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: CUTheme.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      number,
                      style: TextStyle(
                        fontSize: 12,
                        color: CUTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '\\\$\${balance.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`
}

function generateAuthService(): string {
  return `import '../config/credentials.dart';

class AuthService {
  static Future<bool> login(String username, String password) async {
    // TODO: Implement OAuth flow with CUCredentials
    await Future.delayed(const Duration(milliseconds: 500));
    return true;
  }

  static Future<void> logout() async {
    // TODO: Clear tokens and session
  }

  static Future<String?> getAccessToken() async {
    // TODO: Return current access token
    return null;
  }

  static Future<bool> refreshToken() async {
    // TODO: Refresh the access token
    return true;
  }
}
`
}

function generateAPIService(): string {
  return `import 'package:dio/dio.dart';
import '../config/credentials.dart';
import 'auth_service.dart';

class APIService {
  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl: CUCredentials.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ),
  );

  static Future<void> initialize() async {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await AuthService.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer \$token';
        }
        options.headers['X-API-Key'] = CUCredentials.apiKey;
        return handler.next(options);
      },
    ));
  }

  static Future<Response> get(String path) => _dio.get(path);
  static Future<Response> post(String path, dynamic data) => _dio.post(path, data: data);
}
`
}

function generateAccountModel(): string {
  return `class Account {
  final String id;
  final String name;
  final String number;
  final String type;
  final double balance;
  final double availableBalance;

  const Account({
    required this.id,
    required this.name,
    required this.number,
    required this.type,
    required this.balance,
    required this.availableBalance,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      number: json['number'] ?? '',
      type: json['type'] ?? '',
      balance: (json['balance'] ?? 0).toDouble(),
      availableBalance: (json['availableBalance'] ?? 0).toDouble(),
    );
  }
}
`
}

function generateTransactionModel(): string {
  return `class Transaction {
  final String id;
  final String description;
  final double amount;
  final DateTime date;
  final String type;
  final String status;

  const Transaction({
    required this.id,
    required this.description,
    required this.amount,
    required this.date,
    required this.type,
    required this.status,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? '',
      description: json['description'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
      type: json['type'] ?? '',
      status: json['status'] ?? '',
    );
  }
}
`
}

function generateConfigJSON(cu: CUProfile): object {
  return {
    name: cu.displayName,
    charter: cu.charter,
    routing: cu.routing,
    state: cu.state,
    city: cu.city,
    primaryColor: cu.primaryColor,
    logoUrl: cu.logoUrl,
    website: cu.website,
    phone: cu.phone,
    members: cu.members,
    assetsFormatted: cu.assetsFormatted,
    features: cu.features,
    products: cu.products,
    branches: cu.branches,
    generated: {
      by: 'CU.APP Configuration Dashboard',
      at: new Date().toISOString(),
      version: '1.0.0',
    },
  }
}

function generateReadme(cu: CUProfile): string {
  return `# ${cu.displayName} Mobile Banking App

Charter #${cu.charter} | ${cu.state}

## Overview

This Flutter mobile banking application was generated by [CU.APP](https://cu.app) for ${cu.displayName}.

- **Members:** ${cu.members.toLocaleString()}
- **Assets:** ${cu.assetsFormatted}
- **Branches:** ${cu.branches.length} locations

## Quick Start

### Prerequisites

- Flutter SDK 3.16+
- Dart 3.0+
- iOS: Xcode 15+
- Android: Android Studio with SDK 33+

### Setup

1. **Clone this repository**
   \`\`\`bash
   git clone [REPO_URL]
   cd ${cu.charter}_mobile_app
   \`\`\`

2. **Add your credentials**

   Edit \`lib/config/credentials.dart\` with your:
   - OAuth client ID and secret
   - API base URL and key
   - SymXChange connection details

3. **Install dependencies**
   \`\`\`bash
   flutter pub get
   \`\`\`

4. **Run the app**
   \`\`\`bash
   flutter run
   \`\`\`

## Configuration

All credit union branding and features are configured in:
- \`assets/config/cu_config.json\` - Runtime configuration
- \`lib/config/cu_config.dart\` - Type-safe config access
- \`lib/config/features.dart\` - Feature flags
- \`lib/theme/cu_theme.dart\` - Brand colors and theming

## Building for Production

### iOS
\`\`\`bash
flutter build ios --release
\`\`\`

### Android
\`\`\`bash
flutter build appbundle --release
\`\`\`

## Support

- **CU.APP Dashboard:** https://cu.app
- **Documentation:** https://docs.cu.app
- **Support:** support@cu.app

---

Generated by CU.APP • ${new Date().toISOString().split('T')[0]}
`
}

function generateGitHubActions(cu: CUProfile): string {
  return `name: Build ${cu.displayName} App

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'

      - name: Install dependencies
        run: flutter pub get

      - name: Run tests
        run: flutter test

      - name: Build APK
        run: flutter build apk --release

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: build/app/outputs/flutter-apk/app-release.apk

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: 'stable'

      - name: Install dependencies
        run: flutter pub get

      - name: Build iOS (no codesign)
        run: flutter build ios --release --no-codesign
`
}

async function createGitHubRepo(
  token: string,
  cu: CUProfile,
  files: Record<string, string>
): Promise<{ success: boolean; repoUrl?: string; repoName?: string; error?: string }> {
  const repoName = `${cu.charter}-mobile-app`

  try {
    // Get GitHub username
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!userRes.ok) {
      return { success: false, error: 'Could not authenticate with GitHub' }
    }
    const user = await userRes.json()
    const owner = user.login

    // Check if repo exists
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (checkRes.ok) {
      // Repo exists, return it
      const existingRepo = await checkRes.json()
      return {
        success: true,
        repoUrl: existingRepo.html_url,
        repoName: `${owner}/${repoName}`,
      }
    }

    // Create repository
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: `${cu.displayName} Mobile Banking App - Generated by CU.APP`,
        private: false,
        auto_init: true,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      return { success: false, error: err.message }
    }

    const repo = await createRes.json()

    // Wait for repo to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Get default branch SHA
    const branchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!branchRes.ok) {
      return { success: true, repoUrl: repo.html_url, repoName: `${owner}/${repoName}` }
    }

    const branchData = await branchRes.json()
    const latestCommitSha = branchData.object.sha

    // Get tree SHA
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const commitData = await commitRes.json()
    const baseTreeSha = commitData.tree.sha

    // Create blobs for all files
    const blobs = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            encoding: 'utf-8',
          }),
        })
        const blob = await blobRes.json()
        return { path, sha: blob.sha }
      })
    )

    // Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: blobs.map(({ path, sha }) => ({
          path,
          mode: '100644',
          type: 'blob',
          sha,
        })),
      }),
    })
    const treeData = await treeRes.json()

    // Create commit
    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Initial Flutter app for ${cu.displayName}\n\nGenerated by CU.APP Configuration Dashboard\nCharter #${cu.charter}`,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    })
    const newCommit = await newCommitRes.json()

    // Update reference
    await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sha: newCommit.sha }),
    })

    return {
      success: true,
      repoUrl: repo.html_url,
      repoName: `${owner}/${repoName}`,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
