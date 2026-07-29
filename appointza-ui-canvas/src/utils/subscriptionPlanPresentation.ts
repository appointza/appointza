import { SubscriptionPlan } from "@/models/subscription.model";
import { resolveFreeBookings } from "@/utils/subscriptionPlanQuota";

/**
 * Canonical plan list used as a frontend fallback when /Subscription/SelectPlans
 * returns 0 rows. Keep in sync with Database/subscription_tables.sql and
 * SubscriptionPlanService.EnsurePlanCatalogSyncedTransaction.
 */
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: -1,
    plan_code: "free",
    project_name: "appointza",
    display_name: "Free",
    monthly_price_inr: 0,
    booking_fee_inr: 10,
    booking_fee_percent: 3,
    trial_days: 0,
    free_bookings_per_month: 50,
    sort_order: 0,
    isactive: true,
  },
  {
    id: -2,
    plan_code: "starter",
    project_name: "appointza",
    display_name: "Starter",
    monthly_price_inr: 1000,
    booking_fee_inr: 20,
    booking_fee_percent: 2,
    trial_days: 0,
    free_bookings_per_month: 50,
    sort_order: 1,
    isactive: true,
  },
  {
    id: -3,
    plan_code: "growth",
    project_name: "appointza",
    display_name: "Growth",
    monthly_price_inr: 3000,
    booking_fee_inr: 15,
    booking_fee_percent: 1.5,
    trial_days: 0,
    free_bookings_per_month: 200,
    sort_order: 2,
    isactive: true,
  },
  {
    id: -4,
    plan_code: "business",
    project_name: "appointza",
    display_name: "Business",
    monthly_price_inr: 5000,
    booking_fee_inr: 10,
    booking_fee_percent: 1,
    trial_days: 0,
    free_bookings_per_month: 500,
    sort_order: 3,
    isactive: true,
  },
  {
    id: -5,
    plan_code: "enterprise",
    project_name: "appointza",
    display_name: "Enterprise",
    monthly_price_inr: 10000,
    booking_fee_inr: 7,
    booking_fee_percent: 0.7,
    trial_days: 0,
    free_bookings_per_month: 1400,
    sort_order: 4,
    isactive: true,
  },
  {
    id: -6,
    plan_code: "premium",
    project_name: "appointza",
    display_name: "Premium",
    monthly_price_inr: 20000,
    booking_fee_inr: 5,
    booking_fee_percent: 0.5,
    trial_days: 0,
    free_bookings_per_month: 4000,
    sort_order: 5,
    isactive: true,
  },
];

export const getFallbackPlans = (): SubscriptionPlan[] =>
  FALLBACK_PLANS.map((plan) => ({ ...plan }));

/** Paid tiers shown on billing / pricing (excludes Free signup tier). */
export const getPaidFallbackPlans = (): SubscriptionPlan[] =>
  getFallbackPlans().filter((p) => p.plan_code !== "free");

export const ensurePlansForDisplay = (
  plans: SubscriptionPlan[] | undefined | null,
): { plans: SubscriptionPlan[]; usedFallback: boolean } => {
  if (plans && plans.length > 0) {
    return { plans, usedFallback: false };
  }
  return { plans: getFallbackPlans(), usedFallback: true };
};

export const SHARED_PLAN_FEATURES: string[] = [
  "Online scheduling & bookings",
  "Appointments, events & service catalog",
  "Staff, calendars & multi-location",
  "Customer notifications (email / SMS / WhatsApp where enabled)",
  "Payments & booking-fee ledger",
  "Business insights & monthly reports",
  "Standard support",
];

const PLAN_PRESENTATION: Record<string, { bestFor: string; popular?: boolean }> = {
  free: { bestFor: "Start with 50 free bookings every month" },
  starter: { bestFor: "Small businesses starting out" },
  growth: { bestFor: "Growing salons, clinics & service teams", popular: true },
  business: { bestFor: "Busy teams with higher booking volume" },
  enterprise: { bestFor: "High-volume chains & multi-branch operators" },
  premium: { bestFor: "Large franchises with maximum included bookings" },
};

export interface PlanPresentation {
  bestFor: string;
  features: string[];
  popular: boolean;
  freeBookingsLabel: string;
  bookingFeeFormula: string;
  monthlyPriceLabel: string;
  effectiveCostPerBookingLabel: string;
}

const formatPercent = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(value % 1 === 0 ? 0 : 1);
};

export const getEffectiveCostPerBooking = (plan: SubscriptionPlan): number | null => {
  const price = Number(plan.monthly_price_inr ?? 0);
  const included = resolveFreeBookings(plan);
  if (price <= 0 || included <= 0) return null;
  return price / included;
};

export const formatEffectiveCostPerBooking = (plan: SubscriptionPlan): string => {
  const cost = getEffectiveCostPerBooking(plan);
  if (cost == null) return "—";
  const rounded = Math.round(cost * 100) / 100;
  return `₹${rounded.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

export const getPlanPresentation = (plan: SubscriptionPlan): PlanPresentation => {
  const code = (plan.plan_code ?? "").trim().toLowerCase();
  const meta = PLAN_PRESENTATION[code];

  const allowance = resolveFreeBookings(plan);
  const freeBookingsLabel =
    allowance > 0
      ? `${allowance.toLocaleString("en-IN")} included bookings / month`
      : "Unlimited";

  const bookingFeeFormula = `₹${Number(plan.booking_fee_inr).toLocaleString("en-IN")} per booking or ${formatPercent(Number(plan.booking_fee_percent))}% of booking value — whichever is higher`;

  const monthlyPriceLabel = `₹${Number(plan.monthly_price_inr).toLocaleString("en-IN")}`;

  return {
    bestFor: meta?.bestFor ?? "Tailored for your organization",
    features: SHARED_PLAN_FEATURES,
    popular: !!meta?.popular,
    freeBookingsLabel,
    bookingFeeFormula,
    monthlyPriceLabel,
    effectiveCostPerBookingLabel: formatEffectiveCostPerBooking(plan),
  };
};
