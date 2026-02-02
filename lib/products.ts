export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval?: "month" | "year" | "one-time"
  features: string[]
}

// GitHub Clone subscription tiers
export const GITHUB_CLONE_PRODUCTS: Product[] = [
  {
    id: "github-clone-starter",
    name: "Starter Plan",
    description: "Clone to GitHub with basic features",
    priceInCents: 4900, // $49/month
    interval: "month",
    features: ["Clone to 1 GitHub repository", "Automatic config sync", "Basic support", "1 credit union"],
  },
  {
    id: "github-clone-professional",
    name: "Professional Plan",
    description: "Full GitHub integration with advanced features",
    priceInCents: 14900, // $149/month
    interval: "month",
    features: [
      "Clone to unlimited repositories",
      "Monorepo support",
      "CI/CD automation",
      "Priority support",
      "Up to 10 credit unions",
    ],
  },
  {
    id: "github-clone-enterprise",
    name: "Enterprise Plan",
    description: "Complete platform access with white-label options",
    priceInCents: 49900, // $499/month
    interval: "month",
    features: [
      "Unlimited repositories",
      "Full monorepo support",
      "Custom CI/CD pipelines",
      "Dedicated support",
      "Unlimited credit unions",
      "White-label options",
      "API access",
    ],
  },
]

export const SOURCE_CODE_PRODUCT: Product = {
  id: "cu-source-code-full",
  name: "Complete Source Code License",
  description: "Full source code, 700+ production database tables, 100+ edge functions, Zero Material Design System",
  priceInCents: 5000000, // $50,000 one-time
  interval: "one-time",
  features: [
    "Complete Flutter app source code with Riverpod + GoRouter",
    "Full Next.js/Supabase website codebase",
    "700+ production-ready database tables",
    "100+ edge functions for all banking operations",
    "Zero Material Design System (fully customizable)",
    "IVR system with Hume AI integration",
    "Cross-CU fraud detection network access",
    "White-label deployment rights",
    "Dedicated onboarding support",
    "Self-hosted infrastructure documentation",
    "Core banking adapter templates (Symitar, Fiserv, NCR, etc.)",
    "Lifetime updates and security patches",
  ],
}

// Admin users who can bypass paywall
export const ADMIN_EMAILS = ["kmkusche@gmail.com", "compliance@cu.app"]
