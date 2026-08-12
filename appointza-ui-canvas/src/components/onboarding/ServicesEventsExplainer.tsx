import { CalendarDays, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

type ServicesEventsExplainerProps = {
  activeTab: "services" | "events";
  onTabChange: (tab: "services" | "events") => void;
  /** Step 2 onboarding — emphasize adding a service first */
  inOnboarding?: boolean;
  className?: string;
};

export function ServicesEventsExplainer({
  activeTab,
  onTabChange,
  inOnboarding = false,
  className,
}: ServicesEventsExplainerProps) {
  return (
    <div className={cn("org-panel-section border-b border-stone-100 bg-gradient-to-b from-white to-appointza-cream/40", className)}>
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex flex-wrap items-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
            Quick guide
          </span>
          <p className="text-sm text-stone-600">
            Not sure where to start? Here is the difference between a <strong>service</strong> and an{" "}
            <strong>event</strong>.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onTabChange("services")}
            className={cn(
              org.card,
              "rounded-2xl border p-5 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              activeTab === "services"
                ? "border-blue-200 bg-blue-50/40 ring-1 ring-blue-100"
                : "border-stone-100 bg-white",
            )}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Package className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-appointza-navy">Service</h2>
                <p className="text-xs text-stone-500">One-to-one or standard bookings</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-600">
              Something customers book on your calendar — with a duration and price. They pick a time slot
              during your business hours.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-stone-600">
              <li>• Haircut · 45 min · ₹500</li>
              <li>• Dental check-up · 30 min · ₹800</li>
              <li>• Home cleaning · 2 hr · ₹1,200</li>
            </ul>
            {inOnboarding ? (
              <p className="mt-3 text-xs font-medium text-blue-700">
                Add at least one service to finish setup step 2.
              </p>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("events")}
            className={cn(
              org.card,
              "rounded-2xl border p-5 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              activeTab === "events"
                ? "border-blue-200 bg-blue-50/40 ring-1 ring-blue-100"
                : "border-stone-100 bg-white",
            )}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-appointza-navy">Event</h2>
                <p className="text-xs text-stone-500">Fixed date, seats, or workshops</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-600">
              A class, workshop, or ticketed happening on specific dates. Customers register for that
              event — not a regular hourly slot.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-stone-600">
              <li>• Yoga workshop · Sat 10 AM · 20 seats</li>
              <li>• Cooking masterclass · weekend batch</li>
              <li>• Free webinar · registration form</li>
            </ul>
            {inOnboarding ? (
              <p className="mt-3 text-xs text-stone-500">Optional now — you can add events after setup.</p>
            ) : null}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3 text-sm text-stone-600">
          <span className="font-medium text-appointza-navy">Ready?</span>
          <span>
            {activeTab === "services"
              ? "Use New Service to add what you offer every day."
              : "Use New Event to publish a dated class or workshop."}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto rounded-full border-stone-200"
            onClick={() => onTabChange(activeTab === "services" ? "events" : "services")}
          >
            Switch to {activeTab === "services" ? "Events" : "Services"}
          </Button>
        </div>
      </div>
    </div>
  );
}
