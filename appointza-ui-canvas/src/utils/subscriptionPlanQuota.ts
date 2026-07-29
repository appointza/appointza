import { SubscriptionPlan } from "@/models/subscription.model";

const PLAN_FREE_QUOTA_FALLBACK: Record<string, number> = {
  free: 50,
  starter: 50,
  growth: 200,
  business: 500,
  enterprise: 1400,
  premium: 4000,
};

const normalizePlanCode = (code?: string | null) =>
  (code ?? "").trim().toLowerCase();

export const resolveFreeBookings = (plan: SubscriptionPlan): number => {
  if (plan.free_bookings_per_month > 0) {
    return plan.free_bookings_per_month;
  }
  const fallback = PLAN_FREE_QUOTA_FALLBACK[normalizePlanCode(plan.plan_code)];
  return fallback ?? 0;
};

export const resolveFreeBookingsByCode = (
  planCode: string | null | undefined,
  current: number,
): number => {
  if (current > 0) return current;
  const fallback = PLAN_FREE_QUOTA_FALLBACK[normalizePlanCode(planCode)];
  return fallback ?? 0;
};

export const formatFreeBookingsLabel = (plan: SubscriptionPlan): string => {
  const value = resolveFreeBookings(plan);
  if (value <= 0) return "Unlimited";
  return `${value.toLocaleString("en-IN")} included / month`;
};
