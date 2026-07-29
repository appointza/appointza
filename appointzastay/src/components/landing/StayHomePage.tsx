import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  Globe,
  LayoutDashboard,
  Play,
  Smartphone,
  Users,
  BedDouble,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STAY_FAQ_ITEMS, STAY_FEATURE_HIGHLIGHTS } from "@/utils/staySeo";

function HeroMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-lg animate-float"
      role="img"
      aria-label="Hotel management software dashboard with room reservation calendar, occupancy tracking, and guest management"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-slate-500">Owner dashboard</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-900 p-3 text-white sm:col-span-2">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
              <span>Today&apos;s occupancy</span>
              <span className="text-emerald-400">78%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary to-accent" />
            </div>
          </div>
          {[
            { label: "Dashboard", icon: LayoutDashboard, active: true },
            { label: "Calendar", icon: CalendarDays },
            { label: "Room status", icon: BedDouble },
            { label: "Your website", icon: Globe },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium",
                item.active ? "border-primary/30 bg-primary/5 text-primary" : "border-slate-100 text-slate-600",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </div>
          ))}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2">
            <p className="mb-2 text-xs font-semibold text-slate-700">Live room board</p>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              {[
                ["101", "Occupied", "bg-rose-100 text-rose-700"],
                ["102", "Available", "bg-emerald-100 text-emerald-700"],
                ["103", "Reserved", "bg-amber-100 text-amber-700"],
              ].map(([room, status, cls]) => (
                <div key={room} className={cn("rounded-md px-2 py-1.5 text-center font-medium", cls)}>
                  {room}
                  <div className="opacity-80">{status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t bg-slate-50 px-4 py-2 text-center text-[10px] text-slate-500">
          Mobile app · booking alerts · check-in updates
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Globe,
    title: "Free Hotel Website",
    desc: "Launch a hotel booking website and direct booking website for your property in minutes.",
    items: ["Hotel booking website", "Photo gallery", "Online room booking", "Custom domain", "Reviews", "Google Maps"],
  },
  {
    icon: BedDouble,
    title: "Room & Party Hall Management",
    desc: "Property management software for rooms, halls, and venues in real time.",
    items: ["Available", "Occupied", "Reserved", "Party hall booking", "Cleaning", "Maintenance"],
  },
  {
    icon: CalendarDays,
    title: "Room Reservation Calendar",
    desc: "Online room booking system with a visual room reservation calendar.",
    items: ["Daily view", "Weekly view", "Monthly view", "Drag & drop booking", "No double bookings"],
  },
  {
    icon: Users,
    title: "Guest & Reservation Management",
    desc: "Guest management software for every stay and hall booking.",
    items: ["Check-in", "Check-out", "Guest history", "Reservation records", "ID upload"],
  },
  {
    icon: CreditCard,
    title: "Direct Online Booking & Payments",
    desc: "Built-in booking engine with secure online payments.",
    items: ["UPI", "Cards", "Net banking", "Wallets", "Prepaid bookings"],
  },
  {
    icon: BarChart3,
    title: "Occupancy Tracking & Reports",
    desc: "Hotel occupancy dashboard and booking reports at a glance.",
    items: ["Occupancy rate", "Revenue", "Daily income", "Monthly reports", "Booking analytics"],
  },
  {
    icon: Smartphone,
    title: "Mobile Dashboard",
    desc: "Cloud hotel management software you can run from your phone.",
    items: ["Mobile dashboard", "Booking alerts", "Room updates", "Check-in on the go"],
  },
  {
    icon: Bell,
    title: "Housekeeping & Notifications",
    desc: "Coordinate housekeeping with automatic guest and owner alerts.",
    items: ["Housekeeping status", "Booking confirmations", "Check-in reminder", "Checkout reminder"],
  },
];

const PROPERTY_TYPES = [
  "Hotels",
  "Resorts",
  "Lodges",
  "Homestays",
  "Villas",
  "Guest Houses",
  "Service Apartments",
  "Hostels",
  "Party Halls",
  "Wedding Halls",
  "Banquet Halls",
  "Farm Houses",
];

const TRADITIONAL_COSTS = [
  { item: "Website design & development", charge: "₹10,000+", note: "one-time" },
  { item: "Hosting", charge: "₹3,000", note: "/year" },
  { item: "Domain", charge: "₹1,000", note: "/year" },
  { item: "SSL certificate", charge: "Free", note: "Let's Encrypt" },
  { item: "Maintenance & updates", charge: "₹500–₹1,000", note: "/month" },
] as const;

const PRICING = [
  {
    name: "Free",
    price: "₹0",
    highlight: false,
    features: [
      "30 free bookings at signup",
      "Website + hosting included",
      "Room management",
      "Recharge anytime to continue",
    ],
    cta: "Start free",
    href: "/register",
  },
  {
    name: "Starter",
    price: "₹1,000",
    highlight: false,
    sub: "50 bookings · ₹20 each",
    features: ["50 included bookings / month", "Everything in Free", "Online payments", "Email support"],
    cta: "Get Starter",
    href: "/register",
  },
  {
    name: "Growth",
    price: "₹3,000",
    highlight: false,
    sub: "200 bookings · ₹15 each",
    features: ["200 included bookings / month", "Everything in Starter", "Priority support"],
    cta: "Get Growth",
    href: "/register",
  },
  {
    name: "Business",
    price: "₹5,000",
    highlight: true,
    badge: "Most popular",
    sub: "500 bookings · ₹10 each",
    features: ["500 included bookings / month", "Advanced calendar", "Guest CRM", "Priority support"],
    cta: "Get Business",
    href: "/register",
  },
  {
    name: "Enterprise",
    price: "₹10,000",
    highlight: false,
    sub: "1,400 bookings · ~₹7.14 each",
    features: ["1,400 included bookings / month", "Multiple properties", "Custom domain", "Advanced reports"],
    cta: "Get Enterprise",
    href: "/register",
  },
  {
    name: "Premium",
    price: "₹20,000",
    highlight: false,
    sub: "4,000 bookings · ₹5 each",
    features: ["4,000 included bookings / month", "Lowest cost per booking", "Dedicated support", "Priority onboarding"],
    cta: "Get Premium",
    href: "/register",
  },
];

const FAQ = STAY_FAQ_ITEMS.map((item) => ({ q: item.question, a: item.answer }));

export function StayHomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
        </div>
        <div className="container relative mx-auto grid items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
          <div>
            <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
              Hotel management software · property management software · India
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Hotel &amp; Party Hall Booking Software with{" "}
              <span className="gradient-text">Free Booking Website</span>
            </h1>
            <p className="mt-4 text-xl font-semibold text-foreground">
              Create Your Hotel or Party Hall Website &amp; Accept Direct Bookings
            </p>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              <strong className="font-medium text-foreground">Appointza Stay</strong> is an all-in-one{" "}
              <strong className="font-medium text-foreground">hotel management</strong> and{" "}
              <strong className="font-medium text-foreground">party hall booking platform</strong>. Create a
              branded hotel booking website, manage rooms and halls, accept online payments, track occupancy, and
              increase direct bookings from one dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register">
                  Start free <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="lg" asChild>
                <Link to="/property">
                  <Play className="mr-1 h-4 w-4" /> Watch demo
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required · 30 free bookings on signup
            </p>
          </div>
          <HeroMockup />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything You Need to Manage Your{" "}
              <span className="gradient-text">Hotel, Resort or Party Hall</span>
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Hospitality management software with a hotel booking website, room booking software, party hall
              booking software, and property management — built for direct bookings, not OTAs.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border bg-muted/30 p-6 md:p-8">
            <h3 className="text-center font-display text-lg font-semibold md:text-xl">
              Everything You Need
            </h3>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {STAY_FEATURE_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="border-border/60 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader className="pb-2">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription>{f.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {f.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-slate-950 py-20 text-white md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
            Why choose Appointza Stay hotel management software?
          </h2>
          <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="px-5 py-4 font-medium text-slate-400">Others</th>
                  <th className="px-5 py-4 font-semibold text-primary">Appointza Stay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  ["Only booking", "Website + booking + management"],
                  ["Generic website", "Your own branded website"],
                  ["Manual room updates", "Live room status"],
                  ["Limited reports", "Complete analytics"],
                  ["Separate software", "All in one platform"],
                ].map(([others, ours]) => (
                  <tr key={others}>
                    <td className="px-5 py-4 text-slate-400">{others}</td>
                    <td className="px-5 py-4 font-medium">{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Room status demo */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div
              className="rounded-3xl border bg-card p-6 shadow-xl md:p-8"
              role="img"
              aria-label="Hotel occupancy dashboard showing live room status for property management software"
            >
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Live room board
              </p>
              <div className="space-y-3">
                {[
                  { room: "101", status: "Occupied", emoji: "✅", cls: "border-rose-200 bg-rose-50" },
                  { room: "102", status: "Available", emoji: "🟢", cls: "border-emerald-200 bg-emerald-50" },
                  { room: "103", status: "Reserved", emoji: "🟡", cls: "border-amber-200 bg-amber-50" },
                  { room: "104", status: "Cleaning", emoji: "🧹", cls: "border-sky-200 bg-sky-50" },
                  { room: "105", status: "Maintenance", emoji: "🔧", cls: "border-slate-200 bg-slate-50" },
                ].map((r) => (
                  <div
                    key={r.room}
                    className={cn("flex items-center justify-between rounded-xl border px-4 py-3", r.cls)}
                  >
                    <span className="font-display text-lg font-bold">{r.room}</span>
                    <span className="text-sm font-medium">
                      {r.emoji} {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Live room reservation calendar &amp; occupancy tracking
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Housekeeping, front desk, and owners share one hotel PMS view. Update a room once — your room
              reservation system, booking website availability, and occupancy reports stay in sync.
            </p>
          </div>
        </div>
      </section>

      {/* Property types */}
      <section className="border-y border-border bg-muted/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Built for hotels, resorts, lodges &amp; party halls
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Resort booking software, homestay booking software, guest house management software, hostel
            management software, and party hall booking software — all on one stay booking platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {PROPERTY_TYPES.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className="px-4 py-2 text-sm font-medium"
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              No website build fees — just recharge &amp; use
            </h2>
            <p className="mt-3 text-muted-foreground">
              We cover website design, hosting, domain, SSL, and maintenance. You only pay for booking credits when
              you need them.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-muted/40 px-5 py-3">
              <p className="text-sm font-semibold text-foreground">What agencies usually charge vs Appointza Stay</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Item</th>
                    <th className="px-5 py-3 font-medium text-right">Typical agency</th>
                    <th className="px-5 py-3 font-medium text-right">With us</th>
                  </tr>
                </thead>
                <tbody>
                  {TRADITIONAL_COSTS.map((row) => (
                    <tr key={row.item} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-3 text-foreground">{row.item}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {row.charge}
                        <span className="ml-1 text-xs">{row.note}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-primary">Included</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Your only cost:</strong> recharge booking credits and use them —
              no ₹10,000+ build fee, no yearly hosting invoice, no optional maintenance retainer.
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col",
                  plan.highlight && "border-primary shadow-primary ring-2 ring-primary/20",
                )}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="font-display text-3xl font-bold">{plan.price}</div>
                  {plan.sub && <CardDescription>{plan.sub}</CardDescription>}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="mb-6 flex-1 space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? "hero" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link to={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="container mx-auto max-w-2xl px-4">
          <h2 className="text-center font-display text-3xl font-bold">
            Hotel &amp; Party Hall Booking Software — FAQ
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Common questions about our hotel management software, booking engine, and property management platform.
          </p>
          <Accordion type="single" collapsible className="mt-10">
            {FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl gradient-primary px-6 py-14 text-center text-white shadow-primary md:px-12">
            <Sparkles className="mx-auto mb-4 h-10 w-10 opacity-90" />
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Hotel Management Software with Online Booking Website
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
              Create your hotel booking website, manage rooms and party halls, and grow direct bookings with
              Appointza Stay — cloud hotel management software built for India.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">Start free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link to="/property">Schedule demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
