import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/generate-config/[charterId]
 *
 * Generates a complete app configuration for ANY credit union.
 * This is the PROOF that 4,300 CU apps are achievable.
 *
 * The config contains everything needed to build a mobile app:
 * - Identity & branding
 * - Feature flags
 * - Product catalog
 * - Integration slots
 * - Theme tokens
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ charterId: string }> }
) {
  const { charterId } = await params

  if (!charterId) {
    return NextResponse.json({ error: 'charterId is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Fetch from credit_unions table (has all 4,300+ CUs with logos)
    const { data: cu, error } = await supabase
      .from('credit_unions')
      .select('*')
      .eq('charter', parseInt(charterId))
      .single()

    if (error || !cu) {
      return NextResponse.json({ error: `Credit union ${charterId} not found` }, { status: 404 })
    }

    return NextResponse.json(generateConfig(cu, 'credit_unions'))
  } catch (error) {
    console.error('[generate-config] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateConfig(cu: any, source: string) {
  const domain = cu.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const primaryColor = cu.primary_color || generateColorFromName(cu.name || 'Credit Union')
  const name = cu.name || 'Credit Union'
  const displayName = cleanDisplayName(name)
  const logoUrl = cu.logo_url || (domain ? `https://logo.clearbit.com/${domain}` : null)

  return {
    // Meta
    _meta: {
      version: '1.0.0',
      generated: new Date().toISOString(),
      source,
      generator: 'CU.APP Configuration Matrix',
    },

    // Identity
    identity: {
      name: displayName,
      legalName: name,
      charter: cu.charter?.toString() || '',
      routing: '',
      ncuaId: cu.id,
      taxId: '',
    },

    // Location
    location: {
      headquarters: cu.city || '',
      city: cu.city || '',
      state: '',
      zip: '',
      country: 'US',
    },

    // Stats
    stats: {
      totalAssets: cu.total_assets || 0,
      assetsFormatted: formatAssets(cu.total_assets),
      totalMembers: cu.total_members || 0,
      membersFormatted: formatMembers(cu.total_members),
      branchCount: 0,
      employeeCount: 0,
    },

    // Branding
    branding: {
      primaryColor,
      secondaryColor: adjustColor(primaryColor, 20),
      accentColor: adjustColor(primaryColor, -20),
      logoUrl,
      logoUrls: {
        primary: logoUrl,
        clearbit: domain ? `https://logo.clearbit.com/${domain}` : null,
        google: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
        brandfetch: domain ? `https://cdn.brandfetch.io/${domain}/w/400/h/400` : null,
      },
      faviconUrl: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null,
    },

    // Design Tokens (cu_ui compatible)
    designTokens: {
      colors: {
        primary: primaryColor,
        primaryLight: `${primaryColor}1A`,
        primaryDark: adjustColor(primaryColor, -30),
        secondary: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        headingFamily: 'Inter, system-ui, sans-serif',
        monoFamily: 'JetBrains Mono, monospace',
        baseFontSize: 16,
        scale: 1.25,
      },
      spacing: {
        unit: 4,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
      },
    },

    // Contact
    contact: {
      website: cu.website || (domain ? `https://${domain}` : ''),
      phone: cu.phone || '',
      email: cu.email || (domain ? `info@${domain}` : ''),
      supportPhone: cu.support_phone || cu.phone || '',
      supportEmail: cu.support_email || (domain ? `support@${domain}` : ''),
    },

    // Social
    social: {
      facebook: cu.facebook_url || (domain ? `https://facebook.com/${domain.split('.')[0]}` : ''),
      twitter: cu.twitter_url || '',
      linkedin: cu.linkedin_url || '',
      instagram: cu.instagram_url || '',
      youtube: cu.youtube_url || '',
    },

    // App Store
    apps: {
      ios: {
        appStoreId: cu.app_store_id || null,
        bundleId: `org.${domain?.replace(/\./g, '') || 'creditunion'}.mobile`,
        minVersion: '15.0',
      },
      android: {
        playStoreId: cu.play_store_id || null,
        packageName: `com.${domain?.replace(/\./g, '') || 'creditunion'}.mobile`,
        minSdk: 24,
      },
    },

    // Features (default enabled set)
    features: {
      // Account Features
      mobileDeposit: true,
      billPay: true,
      p2p: true,
      wireTransfer: false,
      externalTransfers: true,
      scheduledTransfers: true,

      // Card Features
      cardControls: true,
      cardLock: true,
      travelNotifications: true,
      spendingAlerts: true,

      // Security
      biometrics: true,
      faceId: true,
      fingerprint: true,
      voiceAuth: false,

      // UI
      darkMode: true,
      quickBalance: true,
      widgetSupport: true,

      // Advanced
      budgeting: true,
      savingsGoals: true,
      insights: true,
      chatSupport: false,
      videoCall: false,
    },

    // Products (defaults - would be enriched from core banking)
    products: {
      checking: {
        enabled: true,
        types: ['basic', 'premium', 'rewards'],
      },
      savings: {
        enabled: true,
        types: ['regular', 'money-market', 'youth'],
      },
      certificates: {
        enabled: true,
        terms: [6, 12, 24, 36, 48, 60],
      },
      loans: {
        auto: true,
        personal: true,
        mortgage: true,
        heloc: true,
        student: false,
        creditBuilder: true,
      },
      cards: {
        debit: true,
        credit: true,
        secured: true,
      },
    },

    // Integrations (vendor-agnostic slots)
    integrations: {
      coreBanking: {
        enabled: false,
        provider: null,
        config: {},
      },
      authentication: {
        enabled: false,
        provider: null, // 'auth0', 'okta', 'custom'
        config: {},
      },
      payments: {
        ach: { enabled: true, provider: null },
        wire: { enabled: false, provider: null },
        rtp: { enabled: false, provider: null },
      },
      identity: {
        enabled: false,
        provider: null, // 'alloy', 'lexisnexis', 'plaid'
        config: {},
      },
      fraud: {
        enabled: false,
        provider: null,
        config: {},
      },
      notifications: {
        push: { enabled: false, provider: null },
        sms: { enabled: false, provider: null },
        email: { enabled: false, provider: null },
      },
      voice: {
        enabled: false,
        provider: null, // 'twilio', 'hume', 'deepgram'
        config: {},
      },
      analytics: {
        enabled: false,
        provider: null,
        config: {},
      },
    },

    // Flutter Code Generation
    flutter: {
      // Main.dart entry
      appName: displayName,
      appId: `com.${domain?.replace(/\./g, '') || 'creditunion'}.app`,

      // Theme class name
      themeClass: `${toPascalCase(displayName)}Theme`,

      // Generated file names
      files: {
        main: 'lib/main.dart',
        config: 'lib/config/app_config.dart',
        theme: 'lib/theme/app_theme.dart',
        routes: 'lib/routes/app_routes.dart',
      },
    },

    // Deployment
    deployment: {
      environment: 'development',
      cdnUrl: null,
      apiBaseUrl: null,
      configVersion: 1,
    },
  }
}

// Utility functions
function formatAssets(assets: number | null): string {
  if (!assets) return 'N/A'
  if (assets >= 1_000_000_000) return `$${(assets / 1_000_000_000).toFixed(1)}B`
  if (assets >= 1_000_000) return `$${(assets / 1_000_000).toFixed(0)}M`
  return `$${assets.toLocaleString()}`
}

function formatMembers(members: number | null): string {
  if (!members) return 'N/A'
  if (members >= 1_000_000) return `${(members / 1_000_000).toFixed(1)}M`
  if (members >= 1_000) return `${(members / 1_000).toFixed(0)}K`
  return members.toLocaleString()
}

function cleanDisplayName(name: string): string {
  return name
    .replace(/FEDERAL CREDIT UNION$/i, 'FCU')
    .replace(/CREDIT UNION$/i, 'CU')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function generateColorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  const s = 50 + (Math.abs(hash >> 8) % 30)
  const l = 35 + (Math.abs(hash >> 16) % 20)
  return hslToHex(h, s, l)
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}
