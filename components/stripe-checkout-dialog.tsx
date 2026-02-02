"use client"

import { useCallback, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startGitHubCloneCheckout } from "@/app/actions/stripe"
import { GITHUB_CLONE_PRODUCTS } from "@/lib/products"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StripeCheckoutDialog({ open, onOpenChange, onSuccess }: StripeCheckoutDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [step, setStep] = useState<"select" | "checkout">("select")

  const handleSelectPlan = (productId: string) => {
    setSelectedProductId(productId)
    setStep("checkout")
  }

  const handleBack = () => {
    setStep("select")
    setSelectedProductId(null)
  }

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    if (!selectedProductId) return ""
    const secret = await startGitHubCloneCheckout(selectedProductId)
    return secret ?? ""
  }, [selectedProductId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "select" ? "Choose Your Plan" : "Complete Your Subscription"}</DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Unlock GitHub clone and CI/CD features with a subscription plan"
              : "Enter your payment details to start your subscription"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="grid md:grid-cols-3 gap-4 py-4">
            {GITHUB_CLONE_PRODUCTS.map((product) => (
              <div key={product.id} className="border rounded-lg p-6 flex flex-col relative">
                {product.id === "github-clone-professional" && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}

                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${product.priceInCents / 100}</span>
                    <span className="text-muted-foreground">/{product.interval}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(product.id)}
                  variant={product.id === "github-clone-professional" ? "default" : "outline"}
                  className="w-full"
                >
                  Select Plan
                </Button>
              </div>
            ))}
          </div>
        )}

        {step === "checkout" && selectedProductId && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={handleBack} className="mb-2">
              ← Back to plans
            </Button>
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
