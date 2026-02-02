// PRODUCT CATALOG EDITOR
// Marketing CMS for managing credit union products
// Based on Suncoast JSON schema pattern

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Edit3,
  Eye,
  Save,
  RefreshCw,
  DollarSign,
  Percent,
  Calendar,
  FileText,
  Mic,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"
import { Package } from "lucide-react"

interface ProductCatalogEditorProps {
  cu: CreditUnionData
}

interface Product {
  id: string
  product_name: string
  product_type: string
  category: string
  ivr_description: string
  marketing_copy: string
  product_notes: string
  annual_percentage_rate: number | null
  base_rate: number | null
  rate_type_name: string
  minimum_term_months: number | null
  maximum_term_months: number | null
  minimum_amount: number | null
  maximum_amount: number | null
  auto_pay_applies: boolean
  auto_pay_discount: number | null
  is_active: boolean
  is_featured: boolean
  source_url: string | null
  scrape_confidence: number | null
}

const PRODUCT_CATEGORIES = [
  { id: "consumer_loans", name: "Consumer Loans", icon: "💳" },
  { id: "auto_loans", name: "Auto Loans", icon: "🚗" },
  { id: "mortgage", name: "Mortgage", icon: "🏠" },
  { id: "credit_cards", name: "Credit Cards", icon: "💎" },
  { id: "share_accounts", name: "Share Accounts", icon: "💰" },
  { id: "certificates", name: "Certificates", icon: "📜" },
  { id: "business", name: "Business", icon: "🏢" },
]

const RATE_TYPES = ["Fixed", "Variable", "Tiered", "Promotional"]

export function ProductCatalogEditor({ cu }: ProductCatalogEditorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState("consumer_loans")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const supabase = createClient()

  // Mock products based on Suncoast schema
  useEffect(() => {
    setProducts([
      {
        id: "1",
        product_name: "New Auto Loan",
        product_type: "Auto - New",
        category: "auto_loans",
        ivr_description: "Finance a new vehicle with rates as low as 4.99% APR",
        marketing_copy:
          "Drive away in your dream car with our competitive new auto loan rates. Flexible terms up to 84 months.",
        product_notes: "Requires minimum 680 credit score for best rates",
        annual_percentage_rate: 4.99,
        base_rate: 4.49,
        rate_type_name: "Fixed",
        minimum_term_months: 12,
        maximum_term_months: 84,
        minimum_amount: 5000,
        maximum_amount: 150000,
        auto_pay_applies: true,
        auto_pay_discount: 0.25,
        is_active: true,
        is_featured: true,
        source_url: cu.website,
        scrape_confidence: 0.92,
      },
      {
        id: "2",
        product_name: "Used Auto Loan",
        product_type: "Auto - Used",
        category: "auto_loans",
        ivr_description: "Finance a used vehicle with great rates",
        marketing_copy: "Quality used vehicles deserve quality financing. Rates as low as 5.49% APR.",
        product_notes: "Vehicles must be 7 years old or newer",
        annual_percentage_rate: 5.49,
        base_rate: 4.99,
        rate_type_name: "Fixed",
        minimum_term_months: 12,
        maximum_term_months: 72,
        minimum_amount: 5000,
        maximum_amount: 100000,
        auto_pay_applies: true,
        auto_pay_discount: 0.25,
        is_active: true,
        is_featured: false,
        source_url: cu.website,
        scrape_confidence: 0.88,
      },
      {
        id: "3",
        product_name: "Personal Loan",
        product_type: "Personal",
        category: "consumer_loans",
        ivr_description: "Unsecured personal loans for any purpose",
        marketing_copy: "Get the funds you need without collateral. Competitive rates and flexible terms.",
        product_notes: "Signature loan, no collateral required",
        annual_percentage_rate: 8.99,
        base_rate: 8.49,
        rate_type_name: "Fixed",
        minimum_term_months: 12,
        maximum_term_months: 60,
        minimum_amount: 1000,
        maximum_amount: 50000,
        auto_pay_applies: true,
        auto_pay_discount: 0.25,
        is_active: true,
        is_featured: false,
        source_url: cu.website,
        scrape_confidence: 0.85,
      },
    ])
  }, [cu.id])

  const filteredProducts = products.filter(
    (p) =>
      p.category === selectedCategory &&
      (searchQuery === "" ||
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.product_type.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  async function handleScrapeProducts() {
    setIsScraping(true)
    toast.info("Scanning website for products...", { duration: 3000 })

    // Simulate scraping process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    toast.success("Found 3 new products! Review and approve to add to catalog.")
    setIsScraping(false)
  }

  async function handleSaveProduct() {
    if (!selectedProduct) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? selectedProduct : p)))

    toast.success("Product saved successfully")
    setLoading(false)
    setIsEditing(false)
  }

  function updateProduct(field: keyof Product, value: Product[keyof Product]) {
    if (!selectedProduct) return
    setSelectedProduct({ ...selectedProduct, [field]: value })
  }

  return (
    <div className="flex h-full">
      {/* Categories Sidebar */}
      <div className="w-56 border-r p-3 flex flex-col">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 h-9"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.name}</span>
                <Badge variant="outline" className="ml-auto text-xs h-5">
                  {products.filter((p) => p.category === cat.id).length}
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>

        <Separator className="my-3" />

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 bg-transparent"
          onClick={handleScrapeProducts}
          disabled={isScraping}
        >
          {isScraping ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isScraping ? "Scanning..." : "Scan Website"}
        </Button>
      </div>

      {/* Products List */}
      <div className="w-72 border-r flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-medium text-sm">{PRODUCT_CATEGORIES.find((c) => c.id === selectedCategory)?.name}</h3>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  selectedProduct?.id === product.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-muted",
                )}
                onClick={() => {
                  setSelectedProduct(product)
                  setIsEditing(false)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{product.product_type}</p>
                  </div>
                  {product.is_featured && <Badge className="shrink-0 h-5 text-xs">Featured</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {product.annual_percentage_rate && (
                    <Badge variant="outline" className="text-xs h-5">
                      {product.annual_percentage_rate}% APR
                    </Badge>
                  )}
                  {product.scrape_confidence && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {product.scrape_confidence >= 0.9 ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                      )}
                      {Math.round(product.scrape_confidence * 100)}%
                    </div>
                  )}
                </div>
              </button>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No products found</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Product Editor */}
      <div className="flex-1 flex flex-col">
        {selectedProduct ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{selectedProduct.product_name}</h2>
                <p className="text-sm text-muted-foreground">{selectedProduct.product_type}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button size="sm" className="gap-1" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="gap-1" onClick={handleSaveProduct} disabled={loading}>
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="rates">Rates & Terms</TabsTrigger>
                  <TabsTrigger value="marketing">Marketing</TabsTrigger>
                  <TabsTrigger value="ivr">IVR Script</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Product Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Product Name</Label>
                          <Input
                            value={selectedProduct.product_name}
                            onChange={(e) => updateProduct("product_name", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Product Type</Label>
                          <Input
                            value={selectedProduct.product_type}
                            onChange={(e) => updateProduct("product_type", e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Product Notes (Internal)</Label>
                        <Textarea
                          value={selectedProduct.product_notes}
                          onChange={(e) => updateProduct("product_notes", e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Featured Product</Label>
                          <p className="text-xs text-muted-foreground">Show prominently on website</p>
                        </div>
                        <Switch
                          checked={selectedProduct.is_featured}
                          onCheckedChange={(v) => updateProduct("is_featured", v)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Active</Label>
                          <p className="text-xs text-muted-foreground">Display on website and app</p>
                        </div>
                        <Switch
                          checked={selectedProduct.is_active}
                          onCheckedChange={(v) => updateProduct("is_active", v)}
                          disabled={!isEditing}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rates" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Rates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Percent className="h-3 w-3" /> APR
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={selectedProduct.annual_percentage_rate || ""}
                            onChange={(e) =>
                              updateProduct("annual_percentage_rate", Number.parseFloat(e.target.value) || null)
                            }
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Base Rate</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={selectedProduct.base_rate || ""}
                            onChange={(e) => updateProduct("base_rate", Number.parseFloat(e.target.value) || null)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rate Type</Label>
                          <Select
                            value={selectedProduct.rate_type_name}
                            onValueChange={(v) => updateProduct("rate_type_name", v)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RATE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Terms & Amounts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Min Term (months)
                          </Label>
                          <Input
                            type="number"
                            value={selectedProduct.minimum_term_months || ""}
                            onChange={(e) =>
                              updateProduct("minimum_term_months", Number.parseInt(e.target.value) || null)
                            }
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Term (months)</Label>
                          <Input
                            type="number"
                            value={selectedProduct.maximum_term_months || ""}
                            onChange={(e) =>
                              updateProduct("maximum_term_months", Number.parseInt(e.target.value) || null)
                            }
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Min Amount
                          </Label>
                          <Input
                            type="number"
                            value={selectedProduct.minimum_amount || ""}
                            onChange={(e) => updateProduct("minimum_amount", Number.parseFloat(e.target.value) || null)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Amount</Label>
                          <Input
                            type="number"
                            value={selectedProduct.maximum_amount || ""}
                            onChange={(e) => updateProduct("maximum_amount", Number.parseFloat(e.target.value) || null)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto-Pay Discount</Label>
                          <p className="text-xs text-muted-foreground">
                            {selectedProduct.auto_pay_discount
                              ? `${selectedProduct.auto_pay_discount}% off with auto-pay`
                              : "No discount"}
                          </p>
                        </div>
                        <Switch
                          checked={selectedProduct.auto_pay_applies}
                          onCheckedChange={(v) => updateProduct("auto_pay_applies", v)}
                          disabled={!isEditing}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="marketing" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Marketing Copy
                      </CardTitle>
                      <CardDescription>Customer-facing description for website and app</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={selectedProduct.marketing_copy}
                        onChange={(e) => updateProduct("marketing_copy", e.target.value)}
                        disabled={!isEditing}
                        rows={5}
                        placeholder="Enter marketing description..."
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {selectedProduct.marketing_copy.length} characters
                        </span>
                        {isEditing && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            Generate with AI
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ivr" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        IVR Description
                      </CardTitle>
                      <CardDescription>How the voice assistant describes this product to callers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={selectedProduct.ivr_description}
                        onChange={(e) => updateProduct("ivr_description", e.target.value)}
                        disabled={!isEditing}
                        rows={4}
                        placeholder="Enter IVR script..."
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          ~{Math.ceil(selectedProduct.ivr_description.length / 15)} seconds to speak
                        </span>
                        {isEditing && (
                          <Button variant="outline" size="sm" className="h-6 text-xs gap-1 bg-transparent">
                            <Eye className="h-3 w-3" />
                            Preview Audio
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-1">Select a Product</h3>
              <p className="text-sm text-muted-foreground">Choose a product from the list to view and edit details</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a new product for the catalog</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input placeholder="e.g., Home Equity Line of Credit" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select defaultValue={selectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddDialog(false)}>Create Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
