"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Code, Rocket, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const included = [
  "Pre-configured CU setup",
  "Full API access",
  "Mobile app (Flutter)",
  "Employee portal (Next.js)",
  "IVR integration (Hume AI)",
  "Marketing CMS",
  "Feature catalog",
]

export function PilotProgramSection() {
  const [formData, setFormData] = useState({
    cuName: "",
    charterNumber: "",
    contactName: "",
    contactEmail: "",
    contactTitle: "",
    developerCount: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/culauncher/pilot-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert("Application submitted! We'll contact you soon.")
        setFormData({
          cuName: "",
          charterNumber: "",
          contactName: "",
          contactEmail: "",
          contactTitle: "",
          developerCount: "",
        })
      } else {
        const data = await response.json()
        alert(`Error: ${data.error || "Failed to submit"}`)
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("Failed to submit application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            5 Friendly Credit Unions
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Complete Digital Transformation
          </p>
          <p className="text-lg text-gray-500">
            <Code className="inline h-5 w-5 mr-1" />
            You'll need developers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6">What's Included</h3>
            <ul className="space-y-4">
              {included.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-black mt-0.5 flex-shrink-0" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-6 border-2 border-black bg-black text-white">
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="h-6 w-6" />
                <h4 className="text-xl font-bold">90-Day Pilot</h4>
              </div>
              <p className="text-gray-300">
                Full access for 90 days. Then production deployment.
              </p>
            </div>
          </div>

          <Card className="border-2 border-black rounded-none">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">Apply for Pilot Program</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Credit Union Name *
                  </label>
                  <Input
                    required
                    value={formData.cuName}
                    onChange={(e) => setFormData({ ...formData, cuName: e.target.value })}
                    className="border-2 border-black rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Charter Number *
                  </label>
                  <Input
                    required
                    type="number"
                    value={formData.charterNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, charterNumber: e.target.value })
                    }
                    className="border-2 border-black rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Contact Name *
                  </label>
                  <Input
                    required
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    className="border-2 border-black rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Contact Email *
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    className="border-2 border-black rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Contact Title
                  </label>
                  <Input
                    value={formData.contactTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, contactTitle: e.target.value })
                    }
                    className="border-2 border-black rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Developer Count *
                  </label>
                  <Input
                    required
                    type="number"
                    value={formData.developerCount}
                    onChange={(e) =>
                      setFormData({ ...formData, developerCount: e.target.value })
                    }
                    placeholder="How many developers will work on this?"
                    className="border-2 border-black rounded-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white hover:bg-gray-800 rounded-none border-2 border-black"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
