/**
 * Golden Gate Integration Configuration
 *
 * Golden Gate is an ADA-first accessibility system that provides:
 * - WCAG 2.1 Level A/AA/AAA compliance gates
 * - Self-healing UX with automatic accessibility fixes
 * - In-app feedback collection for AI-driven widget redesign
 * - CI/CD integration for accessibility testing
 *
 * @see ../../../golden_gate - The Flutter package source
 */

// Golden Gate package location relative to this project
export const GOLDEN_GATE_PACKAGE_PATH = "../golden_gate"

// WCAG 2.1 Compliance levels
export type A11yLevel = "A" | "AA" | "AAA"

// Golden Gate configuration for generated Flutter apps
export interface GoldenGateAppConfig {
  // Required WCAG compliance level
  requiredLevel: A11yLevel

  // Minimum touch target size in logical pixels
  // A: 24px, AA: 44px, AAA: 48px
  minTouchTarget: number

  // Enable debug overlay showing a11y badges
  debugMode: boolean

  // Announce state changes to screen readers
  announceChanges: boolean

  // Supabase table for feedback collection
  feedbackTable: string
}

// Default Golden Gate configuration by level
export const GOLDEN_GATE_DEFAULTS: Record<A11yLevel, GoldenGateAppConfig> = {
  A: {
    requiredLevel: "A",
    minTouchTarget: 24,
    debugMode: false,
    announceChanges: false,
    feedbackTable: "widget_feedback",
  },
  AA: {
    requiredLevel: "AA",
    minTouchTarget: 44,
    debugMode: false,
    announceChanges: true,
    feedbackTable: "widget_feedback",
  },
  AAA: {
    requiredLevel: "AAA",
    minTouchTarget: 48,
    debugMode: false,
    announceChanges: true,
    feedbackTable: "widget_feedback",
  },
}

// WCAG 2.1 Contrast ratio requirements
export const WCAG_CONTRAST_RATIOS = {
  A: { normal: 4.5, large: 3.0 },
  AA: { normal: 4.5, large: 3.0 },
  AAA: { normal: 7.0, large: 4.5 },
}

// Golden Gate Flutter package dependency for pubspec.yaml
export const GOLDEN_GATE_PUBSPEC_DEPENDENCY = `
dependencies:
  golden_gate:
    path: ../golden_gate
    # Or from Git:
    # git:
    #   url: https://github.com/kylekusche/golden_gate.git
    #   ref: main
`

// Golden Gate widgets exported by the package
export const GOLDEN_GATE_EXPORTS = [
  "GoldenGate",      // Main accessibility gate widget
  "FeedbackGate",    // Feedback collection wrapper
  "A11yChecker",     // Accessibility compliance checker
  "A11yLevel",       // Compliance level enum
  "A11yCheckResult", // Check result type
  "A11yViolation",   // Violation details
  "A11yWarning",     // Warning details
  "A11ySeverity",    // Severity enum
]

// Helper to generate Golden Gate config for a credit union
export function generateGoldenGateConfig(
  level: A11yLevel = "AA",
  overrides?: Partial<GoldenGateAppConfig>
): GoldenGateAppConfig {
  return {
    ...GOLDEN_GATE_DEFAULTS[level],
    ...overrides,
  }
}

// Helper to check if a color pair meets contrast requirements
export function meetsContrastRequirement(
  contrastRatio: number,
  level: A11yLevel,
  isLargeText: boolean = false
): boolean {
  const required = isLargeText
    ? WCAG_CONTRAST_RATIOS[level].large
    : WCAG_CONTRAST_RATIOS[level].normal
  return contrastRatio >= required
}

// Golden Gate integration status
export interface GoldenGateStatus {
  level: A11yLevel
  passed: boolean
  violations: number
  warnings: number
  checkedAt: Date
}

// Create a passing status
export function createPassingStatus(level: A11yLevel): GoldenGateStatus {
  return {
    level,
    passed: true,
    violations: 0,
    warnings: 0,
    checkedAt: new Date(),
  }
}

// Create a failing status
export function createFailingStatus(
  level: A11yLevel,
  violations: number,
  warnings: number = 0
): GoldenGateStatus {
  return {
    level,
    passed: false,
    violations,
    warnings,
    checkedAt: new Date(),
  }
}
