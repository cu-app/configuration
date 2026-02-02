"use client"

import { FlutterDevicePreview } from "./flutter-device-preview"
import type { CreditUnionData } from "@/lib/credit-union-data"
import type { CreditUnionConfig } from "@/types/cu-config"

interface FlutterPreviewProps {
  cu: CreditUnionData
  config?: CreditUnionConfig
}

export function FlutterPreview({ cu, config }: FlutterPreviewProps) {
  if (!cu) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a credit union to preview their app</p>
      </div>
    )
  }

  return <FlutterDevicePreview cu={cu} />
}
