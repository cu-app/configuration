"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, CreditCard, Shield, Database, Smartphone, Globe, Zap, Lock, Server } from "lucide-react"
import { SOURCE_CODE_PRODUCT, ADMIN_EMAILS } from "@/lib/products"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditUnionName: string
  userEmail?: string
  onPurchaseSuccess?: () => void
}

export function PurchaseDialog({
  open,
  onOpenChange,
  creditUnionName,
  userEmail,
  onPurchaseSuccess,
}: PurchaseDialogProps) {
  const [loading, setLoading] = useState(false)

  // Check if user is admin (bypass paywall)
  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())

  async function handlePurchase() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: SOURCE_CODE_PRODUCT.id,
          creditUnionName,
        }),
      })

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleAdminBypass() {
    onPurchaseSuccess?.()
    onOpenChange(false)
  }

  const features = [
    { icon: Smartphone, label: "Complete Flutter App", desc: "Riverpod + GoRouter + Material Design" },
    { icon: Globe, label: "Next.js Website", desc: "Full CMS with Supabase backend" },
    { icon: Database, label: "700+ Database Tables", desc: "Production-ready schema" },
    { icon: Zap, label: "100+ Edge Functions", desc: "All banking operations covered" },
    { icon: Shield, label: "Fraud Detection Network", desc: "Cross-CU signal sharing" },
    { icon: Server, label: "Self-Hosted Infrastructure", desc: "Deploy on your own servers" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5" />
            Unlock Full Source Code Access
          </DialogTitle>
          <DialogDescription>
            Get complete ownership of your {creditUnionName} mobile banking platform
          </DialogDescription>
        </DialogHeader>

        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{SOURCE_CODE_PRODUCT.name}</h3>
                <p className="text-sm text-muted-foreground">{SOURCE_CODE_PRODUCT.description}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${(SOURCE_CODE_PRODUCT.priceInCents / 100).toLocaleString()}</p>
                <Badge variant="secondary">One-time purchase</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {features.map((feature) => (
                <div key={feature.label} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                  <feature.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-6">
              {SOURCE_CODE_PRODUCT.features.slice(0, 6).map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {isAdmin ? (
              <Button onClick={handleAdminBypass} className="w-full" size="lg">
                <Shield className="h-4 w-4 mr-2" />
                Admin Access - Bypass Paywall
              </Button>
            ) : (
              <Button onClick={handlePurchase} disabled={loading} className="w-full" size="lg">
                <CreditCard className="h-4 w-4 mr-2" />
                {loading ? "Processing..." : "Purchase Now - $50,000"}
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground mt-3">
              Secure payment via Stripe. Includes dedicated onboarding support.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
