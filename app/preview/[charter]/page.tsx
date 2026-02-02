// CREDIT UNION PUBLIC PREVIEW PAGE
// ivr.center style website template for each credit union
// Route: /preview/[charter] - e.g., /preview/5536 for Navy Federal

import { Suspense } from "react"
import { CUWebsiteTemplate } from "@/components/website/cu-website-template"
import { TOP_20_CREDIT_UNIONS } from "@/lib/credit-union-data"

interface PreviewPageProps {
  params: Promise<{ charter: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { charter } = await params

  // Find the credit union by charter number
  const cu = TOP_20_CREDIT_UNIONS.find((c) => c.charter === charter) || TOP_20_CREDIT_UNIONS[0]

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <CUWebsiteTemplate cu={cu} />
    </Suspense>
  )
}
