export interface Configuration {
  id: string
  name: string
  category: string
  status: "active" | "inactive"
  environment: "development" | "staging" | "production"
  version: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ConfigurationFormData = Omit<Configuration, "id" | "created_at" | "updated_at">

export const CATEGORIES = ["infrastructure", "security", "performance", "monitoring", "deployment"] as const

export const ENVIRONMENTS = ["development", "staging", "production"] as const

export const STATUSES = ["active", "inactive"] as const
