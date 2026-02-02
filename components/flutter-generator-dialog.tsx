"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, Download, Smartphone, Palette, Settings, Shield, Info, FileCode } from "lucide-react"
import type { CreditUnionConfig } from "@/types/cu-config"
import { toast } from "sonner"

interface FlutterGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: CreditUnionConfig | null
}

type GeneratorTab = "theme" | "config" | "providers" | "models"

// Helper explanations for each section
const SECTION_HELPERS: Record<GeneratorTab, { title: string; description: string; icon: React.ReactNode }> = {
  theme: {
    title: "Theme & Colors",
    description:
      "Your credit union's brand colors, fonts, and visual styling converted to Flutter's ThemeData. Drop this into your app and everything looks on-brand automatically.",
    icon: <Palette className="h-5 w-5" />,
  },
  config: {
    title: "App Configuration",
    description:
      "All the settings your app needs - feature flags, limits, rules. Instead of hardcoding values, your app reads from this config. Change settings without rebuilding.",
    icon: <Settings className="h-5 w-5" />,
  },
  providers: {
    title: "State Providers",
    description:
      "Riverpod providers that manage your config throughout the app. Any widget can access settings like transfer limits or feature flags with a simple ref.watch().",
    icon: <Shield className="h-5 w-5" />,
  },
  models: {
    title: "Data Models",
    description:
      "Dart classes with JSON serialization for all your config types. These match exactly what your API returns, so parsing is automatic and type-safe.",
    icon: <FileCode className="h-5 w-5" />,
  },
}

export function FlutterGeneratorDialog({ open, onOpenChange, config }: FlutterGeneratorDialogProps) {
  const [activeTab, setActiveTab] = useState<GeneratorTab>("theme")
  const [copied, setCopied] = useState(false)

  if (!config) return null

  // Use non-null assertion since we've checked above
  const safeConfig = config!

  // Generate Flutter theme from design tokens
  function generateTheme(): string {
    const tokens = safeConfig.tokens
    return `// =============================================================================
// GENERATED FLUTTER THEME - ${safeConfig.tenant.name}
// =============================================================================
// 🎨 What is this?
// This file contains your credit union's complete visual theme.
// Colors, fonts, spacing - everything that makes your app look like YOUR app.
//
// 📱 How to use:
// In your main.dart, wrap your app with this theme:
//   MaterialApp(theme: CUAppTheme.light, darkTheme: CUAppTheme.dark, ...)
//
// 💡 Pro tip:
// Never hardcode colors in widgets. Always use Theme.of(context).colorScheme
// =============================================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Your credit union's custom theme
/// 
/// This converts your web design tokens to Flutter's Material Design system.
/// The colors automatically work with all Material widgets (buttons, cards, etc.)
class CUAppTheme {
  // Private constructor - use CUAppTheme.light or CUAppTheme.dark
  CUAppTheme._();

  // ---------------------------------------------------------------------------
  // 🎨 BRAND COLORS
  // ---------------------------------------------------------------------------
  // These are YOUR colors from the config. We convert OKLCH to Flutter's Color.
  
  /// Primary brand color - used for main buttons, app bar, key actions
  /// Think: "This is our main color that members recognize"
  static const Color primary = Color(0xFF${_oklchToHex(tokens.color.primary)});
  
  /// Secondary brand color - used for less prominent elements
  /// Think: "This supports our primary color"
  static const Color secondary = Color(0xFF${_oklchToHex(tokens.color.secondary)});
  
  /// Accent color - used for highlights, badges, attention-grabbing elements
  /// Think: "Look at this!" moments
  static const Color accent = Color(0xFF${_oklchToHex(tokens.color.accent)});
  
  /// Success color - positive states like "Transfer complete!"
  static const Color success = Color(0xFF${_oklchToHex(tokens.color.success)});
  
  /// Warning color - "Heads up!" states like low balance
  static const Color warning = Color(0xFF${_oklchToHex(tokens.color.warning)});
  
  /// Error color - problems like "Transfer failed"
  static const Color error = Color(0xFF${_oklchToHex(tokens.color.error)});
  
  /// Background color - the main app background
  static const Color surface = Color(0xFF${_oklchToHex(tokens.color.surface)});
  
  /// Text color - readable text on the surface
  static const Color onSurface = Color(0xFF${_oklchToHex(tokens.color["on-surface"])});

  // ---------------------------------------------------------------------------
  // 📏 SPACING
  // ---------------------------------------------------------------------------
  // Consistent spacing makes your app feel polished and intentional.
  // Use these instead of random numbers like EdgeInsets.all(17).
  
  /// Base spacing unit: ${tokens.spacing.unit}px
  /// Usage: SizedBox(height: CUAppTheme.space1) for tiny gaps
  static const double spaceUnit = ${tokens.spacing.unit}.0;
  static const double space1 = ${tokens.spacing.unit * 1}.0;  // Tiny gap
  static const double space2 = ${tokens.spacing.unit * 2}.0;  // Small gap  
  static const double space3 = ${tokens.spacing.unit * 3}.0;  // Medium gap
  static const double space4 = ${tokens.spacing.unit * 4}.0;  // Standard gap
  static const double space6 = ${tokens.spacing.unit * 6}.0;  // Large gap
  static const double space8 = ${tokens.spacing.unit * 8}.0;  // Section gap

  // ---------------------------------------------------------------------------
  // 🔘 BORDER RADIUS
  // ---------------------------------------------------------------------------
  // Consistent rounding makes buttons, cards, and inputs feel cohesive.
  
  /// Small radius for chips, badges: ${tokens.radius.sm}px
  static const double radiusSm = ${tokens.radius.sm}.0;
  
  /// Medium radius for buttons, inputs: ${tokens.radius.md}px
  static const double radiusMd = ${tokens.radius.md}.0;
  
  /// Large radius for cards, dialogs: ${tokens.radius.lg}px
  static const double radiusLg = ${tokens.radius.lg}.0;
  
  /// Full radius for pills, avatars
  static const double radiusFull = ${tokens.radius.full}.0;

  // ---------------------------------------------------------------------------
  // ✨ THE ACTUAL THEMES
  // ---------------------------------------------------------------------------
  
  /// Light theme - use this for MaterialApp.theme
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.light(
        primary: primary,
        secondary: secondary,
        tertiary: accent,
        error: error,
        surface: surface,
        onSurface: onSurface,
      ),
      // Typography from your config
      textTheme: GoogleFonts.${_fontToGoogleFonts(tokens.typography.family.body)}TextTheme(),
      // Apply your border radius to all components
      cardTheme: CardTheme(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: space4,
            vertical: space3,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: space4,
          vertical: space3,
        ),
      ),
    );
  }

  /// Dark theme - use this for MaterialApp.darkTheme
  static ThemeData get dark {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: primary,
        secondary: secondary,
        tertiary: accent,
        error: error,
      ),
      textTheme: GoogleFonts.${_fontToGoogleFonts(tokens.typography.family.body)}TextTheme(
        ThemeData.dark().textTheme,
      ),
    );
  }
}

// Helper to use in widgets:
// final theme = Theme.of(context);
// Container(color: theme.colorScheme.primary)
`
  }

  // Generate app config
  function generateConfig(): string {
    return `// =============================================================================
// GENERATED APP CONFIG - ${safeConfig.tenant.name}
// =============================================================================
// ⚙️ What is this?
// This file contains all the business rules and settings for your app.
// Transfer limits, feature flags, timeout settings - it's all here.
//
// 🔧 How to use:
// Access via the provider: ref.watch(appConfigProvider).rules.transfer.dailyLimit
//
// 💡 Why this matters:
// Hardcoding limits like "5000" throughout your app is dangerous.
// When limits change, you'd have to find and update every instance.
// With this config, change it once and it applies everywhere.
// =============================================================================

/// Credit Union Identity
/// 
/// Basic info about your credit union. Used in headers, footers,
/// legal text, and anywhere you need to show "who we are".
class TenantConfig {
  /// Unique identifier - used for API calls and analytics
  /// Example: "cu_navyfed_001"
  final String id;
  
  /// Display name - what members see
  /// Example: "Navy Federal Credit Union"
  final String name;
  
  /// NCUA charter number - for legal/compliance displays
  final String charterNumber;
  
  /// Primary domain - for deep links and sharing
  final String domain;
  
  /// Default timezone - for displaying times to members
  /// Example: "America/New_York"
  final String timezone;
  
  /// Support phone - tap-to-call in help screens
  final String supportPhone;
  
  /// Support email - for contact forms
  final String supportEmail;
  
  /// ABA routing number - for external transfer setup
  final String routingNumber;

  const TenantConfig({
    required this.id,
    required this.name,
    required this.charterNumber,
    required this.domain,
    required this.timezone,
    required this.supportPhone,
    required this.supportEmail,
    required this.routingNumber,
  });
}

/// Transfer Rules
/// 
/// 💰 These control how much money members can move and where.
/// CRITICAL: These limits protect both the member and the credit union.
class TransferRules {
  // ---------------------------------------------------------------------------
  // INTERNAL TRANSFERS (between member's own accounts)
  // ---------------------------------------------------------------------------
  // These are lower risk since money stays within your CU
  
  /// Max per day for internal transfers
  /// Why it matters: Prevents accidental massive transfers
  final double internalDailyLimit;
  
  /// Max per single internal transfer
  final double internalPerTxLimit;

  // ---------------------------------------------------------------------------
  // EXTERNAL TRANSFERS (ACH to/from other banks)
  // ---------------------------------------------------------------------------
  // Higher risk - money leaves your system
  
  /// Max per day for external transfers
  /// Why it matters: Limits exposure if account is compromised
  final double externalDailyLimit;
  
  /// Max per single external transfer
  final double externalPerTxLimit;
  
  /// Days to hold external transfers before releasing
  /// Why it matters: Gives time to catch fraud before money is gone
  final int externalHoldDays;

  // ---------------------------------------------------------------------------
  // P2P TRANSFERS (Zelle-style person to person)
  // ---------------------------------------------------------------------------
  // High fraud risk - immediate and hard to reverse
  
  /// Max per day for P2P
  final double p2pDailyLimit;
  
  /// Max per single P2P transfer
  final double p2pPerTxLimit;
  
  /// Max per month for P2P
  /// Why it matters: Catches "boiling frog" fraud patterns
  final double p2pMonthlyLimit;

  // ---------------------------------------------------------------------------
  // MOBILE DEPOSIT (check photos)
  // ---------------------------------------------------------------------------
  // Fraud risk from bad checks
  
  /// Max deposit per day via mobile
  final double mobileDepositDailyLimit;
  
  /// Max deposit per month via mobile
  final double mobileDepositMonthlyLimit;
  
  /// Max per single check
  final double mobileDepositPerCheckLimit;
  
  /// Hold days for standard deposits
  final int mobileDepositHoldDays;
  
  /// Hold days for new members (higher risk)
  final int mobileDepositNewMemberHoldDays;

  const TransferRules({
    required this.internalDailyLimit,
    required this.internalPerTxLimit,
    required this.externalDailyLimit,
    required this.externalPerTxLimit,
    required this.externalHoldDays,
    required this.p2pDailyLimit,
    required this.p2pPerTxLimit,
    required this.p2pMonthlyLimit,
    required this.mobileDepositDailyLimit,
    required this.mobileDepositMonthlyLimit,
    required this.mobileDepositPerCheckLimit,
    required this.mobileDepositHoldDays,
    required this.mobileDepositNewMemberHoldDays,
  });
}

/// Feature Flags
/// 
/// 🚦 Simple on/off switches for features.
/// Use these to:
/// - Roll out features gradually
/// - Turn off broken features instantly
/// - Enable features for specific CUs
class FeatureFlags {
  /// Can members deposit checks by taking photos?
  final bool mobileDeposit;
  
  /// Can members pay bills through the app?
  final bool billPay;
  
  /// Can members send money to other people?
  final bool p2p;
  
  /// Can members send wire transfers? (usually off for consumer)
  final bool wireTransfer;
  
  /// Can members lock/unlock their cards?
  final bool cardControls;
  
  /// Can members set travel notifications?
  final bool travelNotifications;
  
  /// Show budgeting tools?
  final bool budgeting;
  
  /// Show savings goals feature?
  final bool goals;
  
  /// Can members apply for loans in-app?
  final bool loanApplications;
  
  /// Can members open new accounts in-app?
  final bool accountOpening;
  
  /// Is the AI financial coach enabled?
  final bool aiCoach;
  
  /// Can members use dark mode?
  final bool darkMode;
  
  /// Can members use Face ID / Touch ID?
  final bool biometricAuth;

  const FeatureFlags({
    required this.mobileDeposit,
    required this.billPay,
    required this.p2p,
    required this.wireTransfer,
    required this.cardControls,
    required this.travelNotifications,
    required this.budgeting,
    required this.goals,
    required this.loanApplications,
    required this.accountOpening,
    required this.aiCoach,
    required this.darkMode,
    required this.biometricAuth,
  });
}

/// The complete app configuration
/// 
/// This is the "god object" that contains everything.
/// Access it via: ref.watch(appConfigProvider)
class AppConfig {
  final TenantConfig tenant;
  final TransferRules transferRules;
  final FeatureFlags features;
  
  const AppConfig({
    required this.tenant,
    required this.transferRules,
    required this.features,
  });
}

// =============================================================================
// 🎯 YOUR CREDIT UNION'S ACTUAL CONFIG
// =============================================================================

const appConfig = AppConfig(
  tenant: TenantConfig(
    id: '${safeConfig.tenant.id}',
    name: '${safeConfig.tenant.name}',
    charterNumber: '${safeConfig.tenant.charter_number}',
    domain: '${safeConfig.tenant.domain}',
    timezone: '${safeConfig.tenant.timezone}',
    supportPhone: '${safeConfig.tenant.support.phone}',
    supportEmail: '${safeConfig.tenant.support.email}',
    routingNumber: '${safeConfig.tenant.legal.routing}',
  ),
  transferRules: TransferRules(
    internalDailyLimit: ${safeConfig.rules.transfer.internal.daily_limit}.0,
    internalPerTxLimit: ${safeConfig.rules.transfer.internal.per_tx_limit}.0,
    externalDailyLimit: ${safeConfig.rules.transfer.external.daily_limit}.0,
    externalPerTxLimit: ${safeConfig.rules.transfer.external.per_tx_limit}.0,
    externalHoldDays: ${safeConfig.rules.transfer.external.hold_days},
    p2pDailyLimit: ${safeConfig.rules.transfer.p2p.daily_limit}.0,
    p2pPerTxLimit: ${safeConfig.rules.transfer.p2p.per_tx_limit}.0,
    p2pMonthlyLimit: ${safeConfig.rules.transfer.p2p.monthly_limit}.0,
    mobileDepositDailyLimit: ${safeConfig.rules.mobile_deposit.daily_limit}.0,
    mobileDepositMonthlyLimit: ${safeConfig.rules.mobile_deposit.monthly_limit}.0,
    mobileDepositPerCheckLimit: ${safeConfig.rules.mobile_deposit.per_check_limit}.0,
    mobileDepositHoldDays: ${safeConfig.rules.mobile_deposit.hold_days.default},
    mobileDepositNewMemberHoldDays: ${safeConfig.rules.mobile_deposit.hold_days.new_member},
  ),
  features: FeatureFlags(
    mobileDeposit: ${safeConfig.features.mobile_deposit},
    billPay: ${safeConfig.features.bill_pay},
    p2p: ${safeConfig.features.p2p},
    wireTransfer: ${safeConfig.features.wire_transfer},
    cardControls: ${safeConfig.features.card_controls},
    travelNotifications: ${safeConfig.features.travel_notifications},
    budgeting: ${safeConfig.features.budgeting},
    goals: ${safeConfig.features.goals},
    loanApplications: ${safeConfig.features.loan_applications},
    accountOpening: ${safeConfig.features.account_opening},
    aiCoach: ${safeConfig.features.ai_coach},
    darkMode: ${safeConfig.features.dark_mode},
    biometricAuth: ${safeConfig.features.face_id || safeConfig.features.fingerprint},
  ),
);
`
  }

  // Generate Riverpod providers
  function generateProviders(): string {
    return `// =============================================================================
// GENERATED RIVERPOD PROVIDERS - ${safeConfig.tenant.name}
// =============================================================================
// 🔌 What is this?
// Riverpod providers make your config accessible from ANY widget in your app.
// No prop drilling, no context, just ref.watch(providerName).
//
// 📱 How to use:
// 1. Add riverpod to pubspec.yaml: flutter_riverpod: ^2.4.0
// 2. Wrap your app: ProviderScope(child: MyApp())
// 3. In any widget: final config = ref.watch(appConfigProvider);
//
// 💡 Why Riverpod?
// - Type safe (unlike Provider)
// - Works anywhere (unlike InheritedWidget)
// - Easy testing (just override providers)
// =============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_config.dart'; // The config file we generated

// =============================================================================
// 🎯 MAIN CONFIG PROVIDER
// =============================================================================
// This is the "source of truth" for all configuration.
// Other providers derive from this one.

/// The complete app configuration
/// 
/// Usage:
/// \`\`\`dart
/// class MyWidget extends ConsumerWidget {
///   Widget build(BuildContext context, WidgetRef ref) {
///     final config = ref.watch(appConfigProvider);
///     return Text(config.tenant.name);
///   }
/// }
/// \`\`\`
final appConfigProvider = Provider<AppConfig>((ref) {
  return appConfig; // From app_config.dart
});

// =============================================================================
// 🚦 FEATURE FLAG PROVIDERS
// =============================================================================
// Individual providers for each feature flag.
// Use these for conditional rendering.

/// Is mobile deposit enabled?
/// 
/// Usage:
/// \`\`\`dart
/// if (ref.watch(mobileDepositEnabledProvider)) {
///   return DepositButton();
/// }
/// \`\`\`
final mobileDepositEnabledProvider = Provider<bool>((ref) {
  return ref.watch(appConfigProvider).features.mobileDeposit;
});

/// Is P2P (person-to-person) transfer enabled?
final p2pEnabledProvider = Provider<bool>((ref) {
  return ref.watch(appConfigProvider).features.p2p;
});

/// Is bill pay enabled?
final billPayEnabledProvider = Provider<bool>((ref) {
  return ref.watch(appConfigProvider).features.billPay;
});

/// Are card controls (lock/unlock) enabled?
final cardControlsEnabledProvider = Provider<bool>((ref) {
  return ref.watch(appConfigProvider).features.cardControls;
});

/// Is the AI coach enabled?
final aiCoachEnabledProvider = Provider<bool>((ref) {
  return ref.watch(appConfigProvider).features.aiCoach;
});

/// Is biometric auth (Face ID / Touch ID) enabled?
final biometricAuthEnabledProvider = Provider<bool>((ref) {
  return ref.watch(appConfigProvider).features.biometricAuth;
});

// =============================================================================
// 💰 TRANSFER LIMIT PROVIDERS
// =============================================================================
// Use these to validate transfers before submitting.

/// Transfer limits for internal transfers
/// 
/// Usage:
/// \`\`\`dart
/// final limits = ref.watch(internalTransferLimitsProvider);
/// if (amount > limits.perTx) {
///   showError("Amount exceeds limit of \${limits.perTx}");
/// }
/// \`\`\`
final internalTransferLimitsProvider = Provider<({double daily, double perTx})>((ref) {
  final rules = ref.watch(appConfigProvider).transferRules;
  return (daily: rules.internalDailyLimit, perTx: rules.internalPerTxLimit);
});

/// Transfer limits for external (ACH) transfers
final externalTransferLimitsProvider = Provider<({double daily, double perTx, int holdDays})>((ref) {
  final rules = ref.watch(appConfigProvider).transferRules;
  return (
    daily: rules.externalDailyLimit,
    perTx: rules.externalPerTxLimit,
    holdDays: rules.externalHoldDays,
  );
});

/// Transfer limits for P2P transfers
final p2pTransferLimitsProvider = Provider<({double daily, double perTx, double monthly})>((ref) {
  final rules = ref.watch(appConfigProvider).transferRules;
  return (
    daily: rules.p2pDailyLimit,
    perTx: rules.p2pPerTxLimit,
    monthly: rules.p2pMonthlyLimit,
  );
});

/// Mobile deposit limits
final mobileDepositLimitsProvider = Provider<({double daily, double monthly, double perCheck})>((ref) {
  final rules = ref.watch(appConfigProvider).transferRules;
  return (
    daily: rules.mobileDepositDailyLimit,
    monthly: rules.mobileDepositMonthlyLimit,
    perCheck: rules.mobileDepositPerCheckLimit,
  );
});

// =============================================================================
// 🏢 TENANT INFO PROVIDERS
// =============================================================================
// For displaying credit union info in UI.

/// Credit union name for headers/branding
final cuNameProvider = Provider<String>((ref) {
  return ref.watch(appConfigProvider).tenant.name;
});

/// Support phone number (for tap-to-call)
final supportPhoneProvider = Provider<String>((ref) {
  return ref.watch(appConfigProvider).tenant.supportPhone;
});

/// Support email
final supportEmailProvider = Provider<String>((ref) {
  return ref.watch(appConfigProvider).tenant.supportEmail;
});

// =============================================================================
// 🎯 EXAMPLE: USING IN A WIDGET
// =============================================================================
// 
// class TransferScreen extends ConsumerWidget {
//   @override
//   Widget build(BuildContext context, WidgetRef ref) {
//     // Check if P2P is enabled
//     final p2pEnabled = ref.watch(p2pEnabledProvider);
//     
//     // Get transfer limits
//     final limits = ref.watch(internalTransferLimitsProvider);
//     
//     return Column(
//       children: [
//         Text('Daily limit: \$\${limits.daily}'),
//         if (p2pEnabled) P2PButton(),
//       ],
//     );
//   }
// }
`
  }

  // Generate data models
  function generateModels(): string {
    return `// =============================================================================
// GENERATED DATA MODELS - ${safeConfig.tenant.name}
// =============================================================================
// 📦 What is this?
// Dart classes that represent your data structures with JSON serialization.
// When your API returns JSON, these classes parse it automatically.
//
// 🔧 How to use:
// final config = AppConfig.fromJson(jsonResponse);
// String json = config.toJson();
//
// 💡 Why use these?
// - Type safety: The compiler catches errors, not your users
// - Autocomplete: IDE shows you what fields exist
// - Null safety: No more "null is not an object" crashes
// =============================================================================

import 'package:json_annotation/json_annotation.dart';

part 'models.g.dart'; // Run: flutter pub run build_runner build

// =============================================================================
// 💳 ACCOUNT MODELS
// =============================================================================

/// Types of accounts members can have
/// 
/// Used to determine what UI to show and what actions are available.
/// Example: Checking accounts show debit card, Savings show goals.
enum AccountType {
  @JsonValue('CHECKING')
  checking,
  
  @JsonValue('SAVINGS')
  savings,
  
  @JsonValue('MONEY_MARKET')
  moneyMarket,
  
  @JsonValue('CD')
  certificateOfDeposit,
  
  @JsonValue('IRA')
  ira,
}

/// A member's account (share)
/// 
/// This is what comes back from the accounts API.
/// Maps to the FDX (Financial Data Exchange) standard.
@JsonSerializable()
class Account {
  /// Unique account identifier (not the account number!)
  /// This is safe to log and pass around.
  final String id;
  
  /// Display name like "Free Checking" or "Premium Savings"
  final String name;
  
  /// What kind of account this is
  final AccountType type;
  
  /// Current available balance (what they can spend/transfer)
  /// Different from ledger balance which includes pending.
  final double availableBalance;
  
  /// Total balance including pending transactions
  final double currentBalance;
  
  /// Masked account number for display: "****1234"
  final String maskedNumber;
  
  /// Annual Percentage Yield (interest rate)
  /// Show this on savings accounts.
  final double? apy;
  
  /// Is this account visible in the app?
  /// Members can hide accounts they don't use often.
  final bool isVisible;
  
  /// Can this account send transfers?
  /// Some accounts (like CDs) can't send money out.
  final bool canTransferFrom;
  
  /// Can this account receive transfers?
  final bool canTransferTo;

  Account({
    required this.id,
    required this.name,
    required this.type,
    required this.availableBalance,
    required this.currentBalance,
    required this.maskedNumber,
    this.apy,
    this.isVisible = true,
    this.canTransferFrom = true,
    this.canTransferTo = true,
  });

  factory Account.fromJson(Map<String, dynamic> json) => _\$AccountFromJson(json);
  Map<String, dynamic> toJson() => _\$AccountToJson(this);
}

// =============================================================================
// 💸 TRANSACTION MODELS
// =============================================================================

/// Transaction status
enum TransactionStatus {
  @JsonValue('PENDING')
  pending,    // Not yet finalized
  
  @JsonValue('POSTED')
  posted,     // Completed and final
  
  @JsonValue('CANCELLED')
  cancelled,  // Member or system cancelled
}

/// Transaction type for categorization
enum TransactionType {
  @JsonValue('DEBIT')
  debit,      // Money going out
  
  @JsonValue('CREDIT')
  credit,     // Money coming in
  
  @JsonValue('TRANSFER')
  transfer,   // Internal movement
  
  @JsonValue('FEE')
  fee,        // Service charges
  
  @JsonValue('INTEREST')
  interest,   // Interest earned/charged
}

/// A single transaction
@JsonSerializable()
class Transaction {
  final String id;
  final String accountId;
  
  /// Positive for credits, negative for debits
  final double amount;
  
  /// What shows on the statement: "AMAZON.COM" or "Transfer to Savings"
  final String description;
  
  /// Cleaned up merchant name when available: "Amazon"
  final String? merchantName;
  
  /// Category for budgeting: "Shopping", "Groceries", etc.
  final String? category;
  
  final TransactionStatus status;
  final TransactionType type;
  
  /// When the transaction happened
  final DateTime transactionDate;
  
  /// When it posted to the account (may be different)
  final DateTime? postedDate;

  Transaction({
    required this.id,
    required this.accountId,
    required this.amount,
    required this.description,
    this.merchantName,
    this.category,
    required this.status,
    required this.type,
    required this.transactionDate,
    this.postedDate,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) => _\$TransactionFromJson(json);
  Map<String, dynamic> toJson() => _\$TransactionToJson(this);
  
  /// Is this a debit (money out)?
  bool get isDebit => amount < 0;
  
  /// Is this still processing?
  bool get isPending => status == TransactionStatus.pending;
}

// =============================================================================
// 🔄 TRANSFER MODELS
// =============================================================================

/// Transfer status tracking
enum TransferStatus {
  @JsonValue('DRAFT')
  draft,        // Not yet submitted
  
  @JsonValue('PENDING')
  pending,      // Submitted, waiting to process
  
  @JsonValue('PROCESSING')
  processing,   // Currently being processed
  
  @JsonValue('COMPLETED')
  completed,    // Successfully finished
  
  @JsonValue('FAILED')
  failed,       // Something went wrong
  
  @JsonValue('CANCELLED')
  cancelled,    // Member cancelled
}

/// A transfer request
@JsonSerializable()
class Transfer {
  final String? id;  // Null for new transfers
  
  /// Account ID money is coming FROM
  final String fromAccountId;
  
  /// Account ID money is going TO
  final String toAccountId;
  
  /// Amount to transfer (always positive)
  final double amount;
  
  /// Optional memo: "Rent payment"
  final String? memo;
  
  /// When to process (null = immediately)
  final DateTime? scheduledDate;
  
  /// Is this recurring?
  final bool isRecurring;
  
  /// Recurrence pattern: "WEEKLY", "MONTHLY", etc.
  final String? frequency;
  
  final TransferStatus status;
  
  final DateTime? createdAt;
  final DateTime? completedAt;

  Transfer({
    this.id,
    required this.fromAccountId,
    required this.toAccountId,
    required this.amount,
    this.memo,
    this.scheduledDate,
    this.isRecurring = false,
    this.frequency,
    this.status = TransferStatus.draft,
    this.createdAt,
    this.completedAt,
  });

  factory Transfer.fromJson(Map<String, dynamic> json) => _\$TransferFromJson(json);
  Map<String, dynamic> toJson() => _\$TransferToJson(this);
  
  /// Is this an immediate transfer?
  bool get isImmediate => scheduledDate == null;
}

// =============================================================================
// 👤 MEMBER MODELS
// =============================================================================

/// The logged-in member
@JsonSerializable()
class Member {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  
  /// Member number (different from ID)
  final String memberNumber;
  
  /// When they joined
  final DateTime memberSince;
  
  /// Profile image URL
  final String? avatarUrl;

  Member({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    required this.memberNumber,
    required this.memberSince,
    this.avatarUrl,
  });

  factory Member.fromJson(Map<String, dynamic> json) => _\$MemberFromJson(json);
  Map<String, dynamic> toJson() => _\$MemberToJson(this);
  
  /// Full name for display
  String get fullName => '\$firstName \$lastName';
  
  /// Initials for avatar fallback
  String get initials => '\${firstName[0]}\${lastName[0]}'.toUpperCase();
}
`
  }

  // Helper functions
  function _oklchToHex(oklch: string): string {
    // Simplified conversion - in real implementation would properly convert
    // For now, return reasonable defaults based on common patterns
    if (oklch.includes("250")) return "1e40af" // Blue
    if (oklch.includes("45")) return "ea580c" // Orange accent
    if (oklch.includes("145")) return "16a34a" // Green success
    if (oklch.includes("85")) return "ca8a04" // Yellow warning
    if (oklch.includes("25")) return "dc2626" // Red error
    if (oklch.includes("98%")) return "fafafa" // Light surface
    if (oklch.includes("15%")) return "171717" // Dark text
    return "6366f1" // Default indigo
  }

  function _fontToGoogleFonts(font: string): string {
    // Convert font name to Google Fonts method name
    return font.toLowerCase().replace(/\s+/g, "")
  }

  const generators: Record<GeneratorTab, () => string> = {
    theme: generateTheme,
    config: generateConfig,
    providers: generateProviders,
    models: generateModels,
  }

  const currentCode = generators[activeTab]()

  async function copyToClipboard() {
    await navigator.clipboard.writeText(currentCode)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadFile() {
    const filenames: Record<GeneratorTab, string> = {
      theme: "cu_theme.dart",
      config: "app_config.dart",
      providers: "config_providers.dart",
      models: "models.dart",
    }

    const blob = new Blob([currentCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filenames[activeTab]
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filenames[activeTab]}`)
  }

  function downloadAll() {
    const files = [
      { name: "cu_theme.dart", content: generateTheme() },
      { name: "app_config.dart", content: generateConfig() },
      { name: "config_providers.dart", content: generateProviders() },
      { name: "models.dart", content: generateModels() },
    ]

    // Create a simple concatenated file with clear separators
    const combined = files.map((f) => `// ============ ${f.name} ============\n\n${f.content}`).join("\n\n")

    const blob = new Blob([combined], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${safeConfig.tenant.id}_flutter_config.dart`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded all Flutter files!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Flutter Code Generator
          </DialogTitle>
          <DialogDescription>
            Generate type-safe Dart code for your Flutter mobile app. Every file includes detailed comments explaining
            what each piece does.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as GeneratorTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="theme" className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Config
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5" />
              Models
            </TabsTrigger>
          </TabsList>

          {/* Helper section */}
          <Alert className="mt-4 bg-muted/50 border-muted">
            <Info className="h-4 w-4" />
            <div className="ml-2">
              <div className="font-medium flex items-center gap-2">
                {SECTION_HELPERS[activeTab].icon}
                {SECTION_HELPERS[activeTab].title}
              </div>
              <AlertDescription className="text-sm text-muted-foreground mt-1">
                {SECTION_HELPERS[activeTab].description}
              </AlertDescription>
            </div>
          </Alert>

          <TabsContent value={activeTab} className="flex-1 overflow-hidden mt-4">
            <div className="relative h-full rounded-lg border bg-zinc-950 overflow-hidden">
              <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-700 text-xs">
                  Dart
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-zinc-400 hover:text-white"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <ScrollArea className="h-full">
                <pre className="p-4 text-sm text-zinc-300 font-mono leading-relaxed">
                  <code>{currentCode}</code>
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Generated for <span className="font-medium">{config.tenant.name}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadFile}>
              <Download className="h-4 w-4 mr-2" />
              Download This File
            </Button>
            <Button size="sm" onClick={downloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Download All Files
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
