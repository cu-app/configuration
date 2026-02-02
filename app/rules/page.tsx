import { RuleCanvas } from "@/components/rule-builder/rule-canvas"
import { Toaster } from "sonner"

export default function RulesPage() {
  return (
    <>
      <RuleCanvas />
      <Toaster position="bottom-right" />
    </>
  )
}
