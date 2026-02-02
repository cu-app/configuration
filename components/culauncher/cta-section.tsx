"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Search } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to Transform?
        </h2>
        <p className="text-xl text-gray-400 mb-12">
          Join the pilot program or see your credit union's configuration
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 rounded-none border-2 border-white"
          >
            Join the Pilot Program
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-black text-lg px-8 py-6 rounded-none"
          >
            <Search className="mr-2 h-5 w-5" />
            See Your Configuration
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-black text-lg px-8 py-6 rounded-none"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Schedule a Demo
          </Button>
        </div>

        <div className="mt-16 pt-16 border-t-2 border-white">
          <p className="text-gray-400 text-sm">
            Questions? Contact us at{" "}
            <a href="mailto:pilot@culauncher.com" className="text-white underline">
              pilot@culauncher.com
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
