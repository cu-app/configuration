"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

/**
 * CU UI Design Token System
 * Based on cu_ui/lib/src/tokens/
 *
 * Implements the Geist-inspired design language with:
 * - 8-level accent scale
 * - Semantic colors with variants
 * - Typography tokens
 * - Spacing scale
 * - Animation durations
 */

interface DesignTokensProps {
  cu?: CreditUnionData | null
  className?: string
}

// Light theme accent scale (from cu_ui color_tokens.dart)
const lightAccents = [
  { level: 1, hex: "#fafafa", usage: "Lightest backgrounds" },
  { level: 2, hex: "#eaeaea", usage: "Hover states" },
  { level: 3, hex: "#999999", usage: "Subtle borders" },
  { level: 4, hex: "#888888", usage: "Muted text" },
  { level: 5, hex: "#666666", usage: "Secondary text" },
  { level: 6, hex: "#444444", usage: "Primary text" },
  { level: 7, hex: "#333333", usage: "Bold emphasis" },
  { level: 8, hex: "#111111", usage: "Highest contrast" },
]

// Dark theme accent scale (inverted)
const darkAccents = [
  { level: 1, hex: "#111111", usage: "Darkest backgrounds" },
  { level: 2, hex: "#333333", usage: "Hover states" },
  { level: 3, hex: "#444444", usage: "Subtle borders" },
  { level: 4, hex: "#666666", usage: "Muted text" },
  { level: 5, hex: "#888888", usage: "Secondary text" },
  { level: 6, hex: "#999999", usage: "Primary text" },
  { level: 7, hex: "#eaeaea", usage: "Bold emphasis" },
  { level: 8, hex: "#fafafa", usage: "Highest contrast" },
]

// Semantic colors (from cu_ui)
const semanticColors = [
  {
    name: "Error",
    base: "#ee0000",
    light: "#ff1a1a",
    lighter: "#f7d4d6",
    dark: "#c50000",
    usage: "Errors, destructive actions"
  },
  {
    name: "Success",
    base: "#0070f3",
    light: "#3291ff",
    lighter: "#d3e5ff",
    dark: "#0761d1",
    usage: "Success states, primary actions"
  },
  {
    name: "Warning",
    base: "#f5a623",
    light: "#f7b955",
    lighter: "#ffefcf",
    dark: "#ab570a",
    usage: "Warnings, cautions"
  },
  {
    name: "Cyan",
    base: "#50e3c2",
    light: "#79ffe1",
    lighter: "#aaffec",
    dark: "#29bc9b",
    usage: "Info, selections"
  },
  {
    name: "Violet",
    base: "#7928ca",
    light: "#8a63d2",
    lighter: "#e3d7fc",
    dark: "#4c2889",
    usage: "Premium, special"
  },
]

// Typography scale (from cu_ui typography_tokens.dart)
const typographyScale = [
  { name: "xs", size: "12px", lineHeight: "16px" },
  { name: "sm", size: "14px", lineHeight: "20px" },
  { name: "base", size: "16px", lineHeight: "24px" },
  { name: "lg", size: "18px", lineHeight: "28px" },
  { name: "xl", size: "20px", lineHeight: "28px" },
  { name: "2xl", size: "24px", lineHeight: "32px" },
  { name: "3xl", size: "30px", lineHeight: "36px" },
  { name: "4xl", size: "36px", lineHeight: "40px" },
  { name: "5xl", size: "48px", lineHeight: "1" },
]

// Spacing scale (from cu_ui spacing_tokens.dart)
const spacingScale = [
  { name: "xs", value: "4px" },
  { name: "sm", value: "8px" },
  { name: "md", value: "16px" },
  { name: "lg", value: "24px" },
  { name: "xl", value: "32px" },
  { name: "2xl", value: "48px" },
  { name: "3xl", value: "64px" },
]

// Animation durations (from cu_ui animation_tokens.dart)
const animationDurations = [
  { name: "instant", value: "50ms", usage: "Micro-interactions" },
  { name: "fast", value: "100ms", usage: "Hover states" },
  { name: "normal", value: "200ms", usage: "Standard transitions" },
  { name: "slow", value: "300ms", usage: "Page transitions" },
  { name: "slower", value: "500ms", usage: "Complex animations" },
]

// Radius scale (from cu_ui radius_tokens.dart)
const radiusScale = [
  { name: "none", value: "0px" },
  { name: "sm", value: "4px" },
  { name: "md", value: "8px" },
  { name: "lg", value: "12px" },
  { name: "xl", value: "16px" },
  { name: "2xl", value: "24px" },
  { name: "full", value: "9999px" },
]

export function CuUIDesignTokens({ cu, className }: DesignTokensProps) {
  // Generate brand-specific accent scale if CU provided
  const brandColor = cu?.primaryColor || "#0070f3"

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CU UI Design System</h2>
          <p className="text-muted-foreground text-sm">
            Geist-inspired tokenized design language from cu_ui/lib/src/tokens/
          </p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
          v1.0.0 • Flutter Package
        </Badge>
      </div>

      {/* Brand Colors (if CU selected) */}
      {cu && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Tenant Brand Colors
              <Badge variant="outline" className="font-normal">{cu.displayName}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div
                  className="h-20 rounded-lg mb-2"
                  style={{ backgroundColor: brandColor }}
                />
                <p className="text-xs font-mono">{brandColor}</p>
                <p className="text-[10px] text-muted-foreground">Primary Brand</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-20 rounded-lg mb-2"
                  style={{ backgroundColor: `${brandColor}20` }}
                />
                <p className="text-xs font-mono">{brandColor}20</p>
                <p className="text-[10px] text-muted-foreground">Light Variant</p>
              </div>
              <div className="flex-1">
                <div
                  className="h-20 rounded-lg mb-2 relative overflow-hidden"
                  style={{ backgroundColor: brandColor }}
                >
                  <div className="absolute inset-0 bg-black/30" />
                </div>
                <p className="text-xs font-mono">darken(30%)</p>
                <p className="text-[10px] text-muted-foreground">Dark Variant</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accent Scale */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">8-Level Accent Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2">
            {lightAccents.map((accent) => (
              <div key={accent.level} className="text-center">
                <div
                  className="h-12 rounded-md mb-1 border"
                  style={{ backgroundColor: accent.hex }}
                />
                <p className="text-[10px] font-mono">{accent.hex}</p>
                <p className="text-[9px] text-muted-foreground">accents{accent.level}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Semantic Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Semantic Colors (with variants)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {semanticColors.map((color) => (
              <div key={color.name} className="flex items-center gap-3">
                <div className="w-16 text-xs font-medium">{color.name}</div>
                <div className="flex gap-1 flex-1">
                  <div
                    className="h-8 flex-1 rounded-l-md flex items-center justify-center"
                    style={{ backgroundColor: color.lighter }}
                  >
                    <span className="text-[9px] font-mono opacity-70">lighter</span>
                  </div>
                  <div
                    className="h-8 flex-1 flex items-center justify-center"
                    style={{ backgroundColor: color.light }}
                  >
                    <span className="text-[9px] font-mono text-white">light</span>
                  </div>
                  <div
                    className="h-8 flex-1 flex items-center justify-center"
                    style={{ backgroundColor: color.base }}
                  >
                    <span className="text-[9px] font-mono text-white font-bold">base</span>
                  </div>
                  <div
                    className="h-8 flex-1 rounded-r-md flex items-center justify-center"
                    style={{ backgroundColor: color.dark }}
                  >
                    <span className="text-[9px] font-mono text-white">dark</span>
                  </div>
                </div>
                <div className="w-36 text-[10px] text-muted-foreground">{color.usage}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Typography Scale */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Typography Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {typographyScale.map((type) => (
                <div key={type.name} className="flex items-baseline gap-3">
                  <div className="w-10 text-[10px] font-mono text-muted-foreground">{type.name}</div>
                  <div
                    className="flex-1 truncate"
                    style={{ fontSize: type.size, lineHeight: type.lineHeight }}
                  >
                    {cu?.displayName || "Credit Union"}
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono">{type.size}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spacing Scale */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Spacing Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {spacingScale.map((space) => (
                <div key={space.name} className="flex items-center gap-3">
                  <div className="w-10 text-[10px] font-mono text-muted-foreground">{space.name}</div>
                  <div
                    className="h-4 bg-blue-500/30 rounded"
                    style={{ width: space.value }}
                  />
                  <div className="text-[10px] font-mono">{space.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Border Radius */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Border Radius</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {radiusScale.map((radius) => (
                <div key={radius.name} className="text-center">
                  <div
                    className="w-12 h-12 bg-blue-500/30 border-2 border-blue-500"
                    style={{ borderRadius: radius.value }}
                  />
                  <p className="text-[9px] font-mono mt-1">{radius.name}</p>
                  <p className="text-[8px] text-muted-foreground">{radius.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Animation Durations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Animation Durations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {animationDurations.map((anim) => (
                <div key={anim.name} className="flex items-center gap-3">
                  <div className="w-14 text-[10px] font-mono text-muted-foreground">{anim.name}</div>
                  <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded"
                      style={{ width: `${parseInt(anim.value) / 5}%` }}
                    />
                  </div>
                  <div className="w-12 text-[10px] font-mono text-right">{anim.value}</div>
                  <div className="w-28 text-[9px] text-muted-foreground">{anim.usage}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flutter Import */}
      <Card className="bg-slate-900 text-white border-slate-700">
        <CardContent className="pt-4">
          <p className="text-[10px] text-slate-400 mb-2">Flutter Import</p>
          <code className="text-sm text-emerald-400">
            import 'package:cu_ui/ui.dart';
          </code>
          <div className="mt-3 text-xs text-slate-400">
            <p>50+ fully tokenized components with light/dark theme support</p>
            <p>Location: cu-app-monorepo/cu_ui/lib/ui.dart</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
