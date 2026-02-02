// CU WEBSITE TEMPLATE
// Full Next.js/Supabase website template (ivr.center style)
// Uses same API as Flutter app - canonical Supabase backend

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Phone,
  MapPin,
  Clock,
  Search,
  Menu,
  X,
  ChevronRight,
  Shield,
  Users,
  Zap,
  HeartHandshake,
  Smartphone,
  Building2,
  Star,
  CreditCard,
  Home,
  Car,
  PiggyBank,
  Wallet,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreditUnionData } from "@/lib/credit-union-data"

interface CUWebsiteTemplateProps {
  cu: CreditUnionData
}

export function CUWebsiteTemplate({ cu }: CUWebsiteTemplateProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Mock product data (would come from Supabase in production)
  const products = {
    savings: { name: "Rewards Savings", apy: "3.00", featured: true },
    certificates: { name: "6-Mo Certificate", apy: "4.35", featured: true },
    checking: { name: "Free Checking", apy: "0.10" },
    autoLoan: { name: "Auto Loans", apr: "6.99" },
    homeLoan: { name: "Home Loans", apr: "5.75" },
    personal: { name: "Personal Loans", apr: "7.99" },
    creditCard: { name: "Visa Signature", apr: "10.74" },
  }

  const stats = [
    { value: `${new Date().getFullYear() - 1952}+`, label: "Years of Service" },
    { value: cu.membersFormatted || "50k+", label: "Members" },
    { value: "30k+", label: "Free ATMs" },
    { value: "5,600+", label: "Shared Branches" },
  ]

  const benefits = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Security",
      description: "Deposits insured up to $250,000 by NCUA. Round-the-clock fraud monitoring.",
    },
    {
      icon: <HeartHandshake className="h-6 w-6" />,
      title: "Not-for-Profit",
      description: "As a credit union, earnings go back to members in the form of better rates.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Member-Owned",
      description: "Every member is an owner with voting rights. You have a voice.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Innovation",
      description: "Modern digital tools and smart solutions designed for your lifestyle.",
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Service",
      description: "Your success is our success. Personalized financial guidance when you need it.",
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Convenience",
      description: "Access your money with branches, shared locations, and surcharge-free ATMs.",
    },
  ]

  const testimonials = [
    {
      quote: `${cu.displayName} has been my credit union for over 10 years. Their rates are consistently better than traditional banks.`,
      name: "Sarah M.",
      role: "Member since 2014",
    },
    {
      quote:
        "The mobile app makes banking so easy. I can deposit checks, transfer money, and manage my accounts from anywhere.",
      name: "David L.",
      role: "Member since 2019",
    },
    {
      quote: "Got my auto loan here and the process was seamless. Great rates and friendly service throughout.",
      name: "Jennifer K.",
      role: "Member since 2021",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="#locations" className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
              <MapPin className="h-3.5 w-3.5" />
              Find a Location
            </Link>
            <span className="text-slate-500">Routing #{cu.routing}</span>
            <a
              href={`tel:${cu.phone || "8005551234"}`}
              className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              {cu.phone || "(800) 555-1234"}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#help" className="hover:text-slate-300 transition-colors">
              Help
            </Link>
            <Link href="#rates" className="hover:text-slate-300 transition-colors">
              Rates & Fees
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={cn("sticky top-0 z-50 bg-white transition-shadow", scrolled && "shadow-md")}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: cu.primaryColor }}
            >
              {cu.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-lg leading-tight">{cu.displayName}</p>
              <p className="text-xs text-slate-500">Federal Credit Union</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {["Bank", "Borrow", "Invest", "Insurance", "About"].map((item) => (
              <Button key={item} variant="ghost" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">
                {item}
              </Button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="outline" className="hidden sm:flex bg-transparent" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button style={{ backgroundColor: cu.primaryColor }} className="text-white" asChild>
              <Link href="/join">Join Now</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-bold">{cu.displayName}</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {["Bank", "Borrow", "Invest", "Insurance", "About", "Rates", "Locations", "Help"].map((item) => (
              <Button key={item} variant="ghost" className="w-full justify-start text-lg h-12">
                {item}
              </Button>
            ))}
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${cu.primaryColor}15 0%, ${cu.primaryColor}05 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4" style={{ backgroundColor: `${cu.primaryColor}20`, color: cu.primaryColor }}>
                New Member Bonus Available
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                New members earn a savings boost up to <span style={{ color: cu.primaryColor }}>4.00% APY</span>
                <span className="text-slate-400">*</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-xl">
                {cu.displayName} offers one of the nation's highest yields, plus bonus rewards and exclusive member
                benefits.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" style={{ backgroundColor: cu.primaryColor }} className="text-white" asChild>
                  <Link href="/join">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#rates">View All Rates</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-slate-500 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                NCUA Insured up to $250,000
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="bg-white/80 backdrop-blur">
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl md:text-4xl font-bold" style={{ color: cu.primaryColor }}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Product Cards */}
      <section className="py-4 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <QuickProductCard
              href="#savings"
              label="Rewards Savings"
              value="3.00%"
              unit="APY*"
              color={cu.primaryColor}
            />
            <QuickProductCard
              href="#credit-cards"
              label="Credit Cards"
              value="10.74%"
              unit="APR*"
              prefix="As low as"
              color={cu.primaryColor}
            />
            <QuickProductCard href="#home-loans" label="Home Loans" value="5.75%" unit="APR*" color={cu.primaryColor} />
            <QuickProductCard
              href="#certificates"
              label="6-Mo Certificate"
              value="4.35%"
              unit="APY*"
              color={cu.primaryColor}
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-4 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
            {[
              { icon: <Wallet className="h-5 w-5" />, label: "Checking" },
              { icon: <PiggyBank className="h-5 w-5" />, label: "Savings" },
              { icon: <TrendingUp className="h-5 w-5" />, label: "Certificates" },
              { icon: <Car className="h-5 w-5" />, label: "Auto Loans" },
              { icon: <Home className="h-5 w-5" />, label: "Personal" },
              { icon: <CreditCard className="h-5 w-5" />, label: "Cards" },
            ].map((item) => (
              <Button key={item.label} variant="ghost" className="flex-col h-auto py-3 px-4 md:px-6 gap-1">
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">We are your trusted credit union partner.</h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              A member-owned financial institution invested in your financial well-being.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${cu.primaryColor}15`, color: cu.primaryColor }}
                  >
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">{benefit.title}</h3>
                  <p className="mt-2 text-slate-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">
                Learn More About Us
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Products designed for your success</h2>
            <p className="mt-4 text-lg text-slate-600">
              From savings to loans, we have solutions to help you reach your financial goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard
              badge="Top Rate"
              badgeColor="emerald"
              category="Save"
              title="Rewards Savings"
              rate="3.00%"
              rateLabel="APY*"
              features={["$25 minimum to open", "No monthly fees", "Free mobile banking"]}
              color={cu.primaryColor}
            />
            <ProductCard
              badge="Promo"
              badgeColor="blue"
              category="Save"
              title="Share Certificates"
              rate="4.35%"
              rateLabel="APY*"
              features={["$500 minimum", "Terms 6-60 months", "Bump-up options"]}
              color={cu.primaryColor}
            />
            <ProductCard
              category="Borrow"
              title="Auto Loans"
              rate="6.99%"
              rateLabel="APR*"
              ratePrefix="As low as"
              features={["No payment for 90 days", "Up to 84 month terms", "$0 fees"]}
              color={cu.primaryColor}
            />
            <ProductCard
              category="Borrow"
              title="Home Loans"
              rate="5.75%"
              rateLabel="APR*"
              features={["Fixed & ARM options", "Easy pre-qualification", "Expert loan officers"]}
              color={cu.primaryColor}
            />
            <ProductCard
              badge="Special Offer"
              badgeColor="amber"
              category="Borrow"
              title="Personal Loans"
              rate="7.99%"
              rateLabel="APR*"
              ratePrefix="As low as"
              features={["Borrow up to $50k", "No application fees", "45 day grace period"]}
              color={cu.primaryColor}
            />
            <ProductCard
              category="Borrow"
              title="Credit Cards"
              rate="10.74%"
              rateLabel="APR*"
              ratePrefix="As low as"
              features={["Up to 30k bonus points", "No annual fee options", "Rewards on purchases"]}
              color={cu.primaryColor}
            />
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge style={{ backgroundColor: `${cu.primaryColor}20`, color: cu.primaryColor }}>Mobile Banking</Badge>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold text-slate-900">Bank here, there, or anywhere</h2>
              <p className="mt-4 text-lg text-slate-600">
                Download the {cu.displayName} Mobile App that helps you do it all, no matter where life takes you.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "Transfer funds between accounts",
                  "Deposit checks with mobile deposit",
                  "Check account balances in real-time",
                  "Send money with Zelle",
                  "Manage and lock your cards",
                  "Find nearby ATMs and branches",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: cu.primaryColor }} />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2 bg-transparent" asChild>
                  <a href="#app-store">
                    <Download className="h-4 w-4" />
                    App Store
                  </a>
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent" asChild>
                  <a href="#play-store">
                    <Download className="h-4 w-4" />
                    Google Play
                  </a>
                </Button>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="w-64 h-[500px] rounded-[3rem] p-2 shadow-2xl"
                  style={{ background: "linear-gradient(145deg, #1a1a1a 0%, #2a2a2a 100%)" }}
                >
                  <div className="w-full h-full bg-slate-100 rounded-[2.5rem] overflow-hidden">
                    {/* App Header */}
                    <div className="h-24 px-4 pt-10 pb-4" style={{ backgroundColor: cu.primaryColor }}>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {cu.displayName.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs">Welcome back</p>
                          <p className="text-white font-medium text-sm">John D.</p>
                        </div>
                      </div>
                    </div>

                    {/* Balance Card */}
                    <div className="px-4 -mt-4">
                      <Card className="shadow-lg">
                        <CardContent className="p-4">
                          <p className="text-xs text-slate-500">Checking</p>
                          <p className="text-2xl font-bold text-slate-900">$12,458.32</p>
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-slate-500">Rewards Savings</p>
                            <div className="flex items-baseline justify-between">
                              <p className="text-lg font-semibold text-slate-900">$45,892.15</p>
                              <span className="text-xs" style={{ color: cu.primaryColor }}>
                                Earning 3.00% APY
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-4 mt-4 grid grid-cols-4 gap-2">
                      {["Transfer", "Pay", "Deposit", "More"].map((action) => (
                        <div key={action} className="text-center">
                          <div
                            className="h-10 w-10 mx-auto rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${cu.primaryColor}15` }}
                          >
                            <Smartphone className="h-4 w-4" style={{ color: cu.primaryColor }} />
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">What our members are saying</h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-slate-600">4.7 out of 5 on Trustpilot</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-slate-600 italic">"{testimonial.quote}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: cu.primaryColor }}
                    >
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: cu.primaryColor }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to experience the credit union difference?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join {cu.displayName} today and start enjoying better rates, lower fees, and personalized service.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/join">
                Become a Member
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: cu.primaryColor }}
                >
                  {cu.displayName.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-bold">{cu.displayName}</span>
              </div>
              <p className="text-slate-400 text-sm">Federally insured by NCUA. Equal Housing Opportunity Lender.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Checking
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Savings
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Loans
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Credit Cards
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Rates
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Locations
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {cu.phone || "(800) 555-1234"}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {cu.city}, {cu.state}
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Mon-Fri 8am-6pm
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} {cu.displayName}. All rights reserved.
            </p>
            <div className="flex gap-4 text-slate-400 text-sm">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Disclosures
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Quick Product Card Component
function QuickProductCard({
  href,
  label,
  value,
  unit,
  prefix,
  color,
}: {
  href: string
  label: string
  value: string
  unit: string
  prefix?: string
  color: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border hover:border-slate-300 transition-colors shrink-0"
    >
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-xs text-slate-500">{prefix}</span>}
          <span className="text-xl font-bold" style={{ color }}>
            {value}
          </span>
          <span className="text-sm text-slate-600">{unit}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </Link>
  )
}

// Product Card Component
function ProductCard({
  badge,
  badgeColor,
  category,
  title,
  rate,
  rateLabel,
  ratePrefix,
  features,
  color,
}: {
  badge?: string
  badgeColor?: "emerald" | "blue" | "amber"
  category: string
  title: string
  rate: string
  rateLabel: string
  ratePrefix?: string
  features: string[]
  color: string
}) {
  const badgeColors = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
  }

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          {badge && (
            <Badge className={cn("text-xs", badgeColor ? badgeColors[badgeColor] : "")} variant="outline">
              {badge}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>

        <h3 className="font-semibold text-lg text-slate-900">{title}</h3>

        <div className="mt-2 flex items-baseline gap-1">
          {ratePrefix && <span className="text-sm text-slate-500">{ratePrefix}</span>}
          <span className="text-3xl font-bold" style={{ color }}>
            {rate}
          </span>
          <span className="text-slate-600">{rateLabel}</span>
        </div>

        <ul className="mt-4 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color }} />
              {feature}
            </li>
          ))}
        </ul>

        <Button variant="link" className="mt-4 p-0 h-auto" style={{ color }}>
          Learn More
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
