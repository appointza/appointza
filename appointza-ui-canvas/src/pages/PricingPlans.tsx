import { useMemo } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { PlanCards } from "@/components/subscription/PlanCards";
import { cn } from "@/lib/utils";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Loader2 } from "lucide-react";

const PricingPlans = () => {
  const { plans, loading, error } = useSubscriptionPlans("appointza");
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [plans],
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 px-4 bg-appointza-light">
          <div className="container mx-auto">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <h1 className="mb-4 text-4xl font-bold text-appointza-navy md:text-5xl">
                Appointza pricing — simple &amp; clear
              </h1>
              <p className="text-lg text-gray-600">
                Every plan ships with the <strong>same Appointza feature set</strong>. The only thing that changes
                between tiers is the monthly price, the included free-booking quota and the per-booking fee.
              </p>
              <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-orange-200 bg-orange-50/90 px-5 py-4 text-left shadow-sm md:text-center">
                <p className="font-semibold text-orange-950">Sign up free</p>
                <p className="mt-1 text-sm text-orange-950/85">
                  Every new organization starts on the <strong>Free plan</strong> with{" "}
                  <strong>50 free bookings every month</strong>. No credit card required.
                </p>
                <p className="mt-2 text-xs text-orange-900/75">
                  Upgrade to a paid plan for a larger monthly quota and lower per-booking fees.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading plans from database…
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-destructive">{error}</p>
            ) : sortedPlans.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No pricing plans found in the database.</p>
            ) : (
              <PlanCards
                plans={sortedPlans}
                getCta={(plan, { isPopular }) => {
                  const planKey = (plan.plan_code ?? "").trim().toLowerCase();
                  const cta =
                    planKey === "free"
                      ? "Start free"
                      : planKey === "starter"
                        ? "Choose Starter"
                        : planKey === "growth"
                          ? "Choose Growth"
                          : planKey === "business"
                            ? "Choose Business"
                            : planKey === "enterprise"
                              ? "Choose Enterprise"
                              : planKey === "premium"
                                ? "Choose Premium"
                                : `Choose ${plan.display_name}`;
                  const ctaLink = `/register?plan=${encodeURIComponent(planKey || "free")}`;
                  return (
                    <Link
                      to={ctaLink}
                      className={cn(
                        "block w-full rounded-full py-3 text-center text-sm font-extrabold",
                        isPopular ? "bg-white text-zinc-950" : "bg-zinc-950 text-white",
                      )}
                    >
                      {cta}
                    </Link>
                  );
                }}
              />
            )}
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="container mx-auto">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="section-title">Frequently asked questions</h2>
            </div>

            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-medium text-appointza-navy">What does “whichever is higher” mean?</h3>
                <p className="text-gray-600">
                  For each confirmed booking through Appointza, we compare the rupee-per-booking amount and the
                  percentage of the booking total. Your organization is charged whichever amount is larger that month
                  — so tiny ticket sizes still cover platform cost, while large invoices pay a fair percentage.
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-medium text-appointza-navy">
                  What do I get when I sign up?
                </h3>
                <p className="text-gray-600">
                  You start on the <strong>Free plan</strong> with <strong>50 free bookings every month</strong>.
                  After that quota, booking fees apply using the higher of a fixed rupee amount or a percentage.
                  Paid plans add more free bookings each month and lower per-booking fees.
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-medium text-appointza-navy">
                  Does the booking fee apply to cancellations?
                </h3>
                <p className="text-gray-600">
                  We only charge booking-linked fees where your policy confirms a booked or fulfilled transaction —
                  wording on your invoices can match your merchant policy. Detail your refunds and no-shows during
                  onboarding.
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-2 text-xl font-medium text-appointza-navy">Can I change plans?</h3>
                <p className="text-gray-600">
                  Yes. Upgrade or downgrade for the next billing cycle. Pricing that depends on bookings automatically
                  uses the formulas for the plan active when the booking settles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPlans;
