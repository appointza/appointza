import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubscriptionApiErrorMessage,
  SubscriptionService,
} from "@/services/subscription.service";
import {
  OrganisationMonthlyBookingStatsRes,
  OrganisationSubscriptionStatusRes,
  SubscriptionPlan,
} from "@/models/subscription.model";
import { useBillingTopUp } from "@/hooks/useBillingTopUp";
import { resolveFreeBookingsByCode, resolveFreeBookings } from "@/utils/subscriptionPlanQuota";
import { getPlanPresentation } from "@/utils/subscriptionPlanPresentation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Copy,
  CreditCard,
  Gift,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { PlanCards } from "@/components/subscription/PlanCards";
import { CreditWalletBillingPanel } from "@/components/organization/CreditWalletBillingPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationReferralInfoRes } from "@/models/organisation.model";
import { Input } from "@/components/ui/input";

const normalizePlanCode = (code?: string | null) => (code ?? "").trim().toLowerCase();

const formatPackDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const periodTypeLabel = (type?: string) => {
  switch (type) {
    case "launch_trial":
      return "Legacy launch trial";
    case "free":
      return "Free tier";
    case "billing_period":
      return "Billing period";
    default:
      return "Current period";
  }
};

const SubscriptionBillingPanel = ({ embedded = false }: { embedded?: boolean }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<OrganisationSubscriptionStatusRes | null>(null);
  const [referralInfo, setReferralInfo] = useState<OrganisationReferralInfoRes | null>(null);
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<OrganisationMonthlyBookingStatsRes | null>(null);
  const [loadingCore, setLoadingCore] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);

  const orgId = user?.organisationid ?? 0;

  const loadCore = useCallback(async () => {
    setLoadingCore(true);
    try {
      const [planList, subStatus] = await Promise.all([
        subscriptionService.selectPlans("appointza"),
        subscriptionService.getStatus(orgId > 0 ? orgId : undefined),
      ]);
      setPlans([...planList].sort((a, b) => a.sort_order - b.sort_order));
      setStatus(subStatus);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load billing",
        description: getSubscriptionApiErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setLoadingCore(false);
    }
  }, [subscriptionService, toast, orgId]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const bookingStats = await subscriptionService.getMonthlyBookingStats(
        orgId > 0 ? orgId : undefined,
        12,
      );
      setMonthlyStats(bookingStats);
    } catch (e) {
      console.error(e);
      setMonthlyStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [subscriptionService, orgId]);

  const loadReferral = useCallback(async () => {
    if (orgId <= 0) {
      setReferralInfo(null);
      setLoadingReferral(false);
      return;
    }
    setLoadingReferral(true);
    try {
      const info = await organisationService.getReferral(orgId);
      setReferralInfo(info ?? null);
    } catch (e) {
      console.error(e);
      setReferralInfo(null);
    } finally {
      setLoadingReferral(false);
    }
  }, [organisationService, orgId]);

  useEffect(() => {
    loadCore();
    loadStats();
    loadReferral();
  }, [loadCore, loadStats, loadReferral]);

  const referralSignupUrl = useMemo(() => {
    if (!referralInfo?.referral_code) return "";
    const base = window.location.origin;
    const params = new URLSearchParams({
      ref: referralInfo.referral_code,
    });
    return `${base}/register?${params.toString()}`;
  }, [referralInfo?.referral_code]);

  const copyReferralCode = async () => {
    if (!referralInfo?.referral_code) return;
    try {
      await navigator.clipboard.writeText(referralInfo.referral_code);
      toast({ title: "Copied", description: "Referral code copied to clipboard." });
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const copyReferralLink = async () => {
    if (!referralSignupUrl) return;
    try {
      await navigator.clipboard.writeText(referralSignupUrl);
      toast({ title: "Copied", description: "Referral signup link copied to clipboard." });
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const confirmChangePlan = async () => {
    if (!pendingPlan) return;
    const planCode = pendingPlan.plan_code;
    setPendingPlan(null);
    setChanging(planCode);
    try {
      const updated = await subscriptionService.changePlan(
        planCode,
        orgId > 0 ? orgId : undefined,
      );
      setStatus(updated);
      toast({
        title: "Plan updated",
        description: `You are now on ${updated.plan_display_name}.`,
      });
    } catch (e) {
      toast({
        title: "Could not change plan",
        description: getSubscriptionApiErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setChanging(null);
    }
  };

  const { paying, pay: handlePayOutstanding } = useBillingTopUp({
    organisationId: orgId > 0 ? orgId : undefined,
    onPaid: loadCore,
  });

  const currentPlanCode = normalizePlanCode(status?.plan_code);
  const displayPlans = [...plans]
    .filter((p) => p.isactive !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const paidPlans = displayPlans.filter((p) => normalizePlanCode(p.plan_code) !== "free");
  const isWallet = status?.billing_mode === "credit_wallet";

  const switchBillingMode = async (tab: string) => {
    const mode = tab === "wallet" ? "credit_wallet" : "subscription";
    if (mode === status?.billing_mode) return;
    try {
      await subscriptionService.setBillingMode(mode, orgId);
      const updated = await subscriptionService.getStatus(orgId);
      setStatus(updated);
      toast({
        title: mode === "credit_wallet" ? "Credit Wallet enabled" : "Subscription billing enabled",
      });
    } catch (e) {
      toast({
        title: "Could not change billing mode",
        description: getSubscriptionApiErrorMessage(e),
        variant: "destructive",
      });
    }
  };

  if (loadingCore) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (orgId <= 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        Billing and plan changes are available for organization accounts. Sign in as the organization
        owner (not staff-only) to manage your subscription.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={pendingPlan !== null} onOpenChange={(open) => !open && setPendingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change subscription plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPlan && (
                <>
                  Switch from <strong>{status?.plan_display_name ?? "current plan"}</strong> to{" "}
                  <strong>{pendingPlan.display_name}</strong>.
                  {status?.is_in_trial ? (
                    <>
                      {" "}
                      Your existing trial continues until{" "}
                      {status.trial_ends_at
                        ? new Date(status.trial_ends_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "the trial end date"}
                      .
                    </>
                  ) : (
                    <>
                      {" "}
                      Standard pricing applies (₹
                      {pendingPlan.monthly_price_inr.toLocaleString("en-IN")}/month plus booking
                      fees after your free monthly quota).
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changing !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              disabled={changing !== null}
              onClick={(e) => {
                e.preventDefault();
                void confirmChangePlan();
              }}
            >
              {changing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Confirm change"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="rounded-3xl border-orange-100 bg-gradient-to-br from-orange-50/80 to-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-appointza-navy">
            <Gift className="h-5 w-5 text-orange-600" />
            Refer & earn credits
          </CardTitle>
          <CardDescription>
            Share your unique code. When a new organization registers with it, you get{" "}
            {referralInfo?.bonus_credits_per_referral ?? 50} free booking credits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingReferral ? (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              Loading referral code…
            </div>
          ) : referralInfo?.referral_code ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  readOnly
                  value={referralInfo.referral_code}
                  className="font-mono text-base font-semibold tracking-wide"
                />
                <Button type="button" variant="outline" onClick={copyReferralCode} className="shrink-0">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy code
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input readOnly value={referralSignupUrl} className="text-sm" />
                <Button type="button" variant="outline" onClick={copyReferralLink} className="shrink-0">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </Button>
              </div>
              <p className="text-sm text-stone-600">
                Successful referrals:{" "}
                <span className="font-semibold text-appointza-navy">
                  {referralInfo.successful_referrals}
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-500">Referral code is not available yet.</p>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={isWallet ? "wallet" : "subscription"}
        onValueChange={(v) => void switchBillingMode(v)}
        className="space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="wallet" className="gap-2">
            <Wallet className="h-4 w-4" />
            Credit Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <CreditWalletBillingPanel organisationId={orgId} />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
      {status?.is_in_trial && (
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-950">One-time 6-month launch offer active</p>
              <p className="mt-1 text-sm text-orange-900/90">
                {status.trial_days_remaining != null
                  ? `${status.trial_days_remaining} days left`
                  : "Trial period"}{" "}
                — ₹0 subscription and booking fees on eligible plans. This offer is used once
                per organization and will not apply again after it ends.
              </p>
              {status.trial_ends_at && (
                <p className="mt-2 text-xs text-orange-800/80">
                  Trial ends:{" "}
                  {new Date(status.trial_ends_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {status?.launch_offer_availed && !status?.is_in_trial && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Launch offer already used</p>
          <p className="mt-1">
            Your previous launch trial
            {status.launch_offer_availed_at
              ? ` started on ${new Date(status.launch_offer_availed_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}{" "}
            and has ended. You can still change plans; standard monthly and booking fees apply.
          </p>
        </div>
      )}

      {status?.launch_offer_available && !status?.is_in_trial && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-sm text-orange-950">
          <p className="font-medium">One-time launch offer available</p>
          <p className="mt-1 text-orange-900/90">
            Switch to a plan with a trial to activate {status.launch_trial_days ?? 180} days free
            (subscription + booking fees). This can only be claimed once for this organization.
          </p>
        </div>
      )}

      {(status?.outstanding_amount_inr ?? 0) > 0 && (
        <Card className="rounded-3xl border-red-200 bg-red-50/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Booking-fee overage due
            </CardTitle>
            <CardDescription className="text-red-900/80">
              You crossed the free-booking allowance for{" "}
              <strong>{status?.plan_display_name ?? "your plan"}</strong>. The platform fee for the
              extra bookings is now payable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-red-200 bg-white px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700/70">
                  Amount due
                </p>
                <p className="mt-1 text-2xl font-bold text-red-900">
                  ₹{Number(status?.outstanding_amount_inr ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700/70">
                  Bookings beyond free quota
                </p>
                <p className="mt-1 text-2xl font-bold text-red-900">
                  {(status?.unpaid_bookings_count ?? 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700/70">
                  Plan formula
                </p>
                <p className="mt-1 text-sm font-semibold text-red-900">
                  {status?.booking_fee_formula}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="lg"
              className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              disabled={paying}
              onClick={() => void handlePayOutstanding()}
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Razorpay…
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{Number(status?.outstanding_amount_inr ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} now
                </>
              )}
            </Button>
            <p className="text-xs text-red-900/70">
              Secure payment via Razorpay. Once verified, the fee ledger is settled automatically
              and your account is taken out of overdue status.
            </p>
          </CardContent>
        </Card>
      )}

      {(() => {
        // Decide whether the org has a real subscription row yet. When the
        // `subscription_plans` catalog or `organisation_subscriptions` row is
        // missing, `plan_display_name` and `booking_fee_formula` come back
        // empty even though /GetStatus succeeded. We surface that as a
        // friendly "what's needed and why" panel instead of a row of dashes.
        const hasPlanName = !!status?.plan_display_name?.trim();
        const hasFormula = !!status?.booking_fee_formula?.trim();
        const hasMonthlyPrice = (status?.monthly_price_inr ?? 0) > 0;
        const subscriptionInitialised =
          hasPlanName || hasFormula || hasMonthlyPrice || !!status?.subscription_created_at;
        return (
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
                Current plan
              </CardTitle>
              <CardDescription>Your Appointza subscription for this organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!subscriptionInitialised && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
                  <p className="font-semibold">No subscription on file yet</p>
                  <p className="mt-1 text-amber-900/85">
                    To populate this card we need a row in{" "}
                    <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
                      organisation_subscriptions
                    </code>{" "}
                    pointing to a plan in{" "}
                    <code className="rounded bg-white/70 px-1 py-0.5 text-xs">
                      subscription_plans
                    </code>
                    . Pick a tier below — the platform will start your 6-month launch trial and
                    fill in the plan name, price, fee formula and pack-period dates automatically.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {hasPlanName ? status?.plan_display_name : "Not selected"}
                </span>
                <Badge variant="secondary" className="capitalize">
                  {status?.status?.trim() ? status.status : "pending"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Monthly (after trial):{" "}
                <strong>
                  ₹{Number(status?.monthly_price_inr ?? 0).toLocaleString("en-IN")}/month
                </strong>
                {!hasMonthlyPrice && (
                  <span className="ml-2 text-xs text-gray-400">
                    · set after you pick a plan
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                Booking fee (after trial):{" "}
                <strong>
                  {hasFormula
                    ? status?.booking_fee_formula
                    : "—"}
                </strong>
                {!hasFormula && (
                  <span className="ml-2 text-xs text-gray-400">
                    · loaded from the selected plan in <code className="text-[11px]">subscription_plans</code>
                  </span>
                )}
              </p>

          {(() => {
            // Resolve allowance: prefer the server value, fall back to the
            // canonical quota for known plan codes when the DB still has 0.
            const allowance = resolveFreeBookingsByCode(
              status?.plan_code,
              status?.free_bookings_per_month ?? 0,
            );
            const used = Math.max(0, status?.free_bookings_used_this_month ?? 0);
            const unlimited = allowance <= 0;
            const remaining = unlimited ? null : Math.max(0, allowance - used);
            return (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
                  Free bookings · this calendar month
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-emerald-900/70">Allowance</p>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-950">
                      {unlimited
                        ? "Unlimited"
                        : `${allowance.toLocaleString("en-IN")} bookings`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-900/70">Used so far</p>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-950">
                      {used.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-900/70">Remaining</p>
                    <p className="mt-0.5 text-sm font-semibold text-emerald-700">
                      {unlimited ? "Unlimited" : (remaining ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-emerald-900/70">
                  Within this allowance, booking fees are waived. Beyond it, the plan formula
                  applies (resets each calendar month).
                </p>
              </div>
            );
          })()}

          {(() => {
            const startedOn =
              status?.plan_started_at ??
              status?.current_period_start ??
              status?.subscription_created_at ??
              null;
            const endsOn =
              status?.plan_ends_at ??
              status?.trial_ends_at ??
              status?.current_period_end ??
              null;
            const startedLabel = formatPackDate(startedOn);
            const endsLabel = formatPackDate(endsOn);
            return (
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pack period · {periodTypeLabel(status?.period_type)}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">Started on</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">{startedLabel}</p>
                    {startedLabel === "—" && (
                      <p className="mt-1 text-[11px] leading-snug text-gray-400">
                        Set when your subscription row is created (signup or first plan switch).
                        Stored as <code className="text-[10px]">current_period_start</code>.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ends on</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">{endsLabel}</p>
                    {endsLabel === "—" && (
                      <p className="mt-1 text-[11px] leading-snug text-gray-400">
                        On a launch trial → <code className="text-[10px]">trial_ends_at</code>.
                        After trial → <code className="text-[10px]">current_period_end</code>.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {status?.is_in_trial ? "Trial days left" : "Status"}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-orange-700">
                      {status?.is_in_trial && status.trial_days_remaining != null
                        ? `${status.trial_days_remaining} days`
                        : status?.is_in_trial
                          ? "Active trial"
                          : subscriptionInitialised
                            ? status?.plan_ends_at
                              ? "Ended / renews per plan"
                              : "Active"
                            : "Pending plan selection"}
                    </p>
                  </div>
                </div>
                {status?.launch_offer_availed_at && (
                  <p className="mt-3 border-t border-gray-200/80 pt-3 text-xs text-gray-500">
                    Launch offer claimed on {formatPackDate(status.launch_offer_availed_at)} · one-time
                    per organization
                  </p>
                )}
                {status?.subscription_created_at && (
                  <p className="mt-1 text-xs text-gray-400">
                    Subscription record created {formatPackDate(status.subscription_created_at)}
                  </p>
                )}
                <p className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white/80 px-3 py-2 text-xs leading-relaxed text-gray-500">
                  <strong className="text-gray-700">Where dates are stored:</strong> PostgreSQL table{" "}
                  <code className="text-[11px]">organisation_subscriptions</code> —{" "}
                  <code className="text-[11px]">current_period_start</code> (start),{" "}
                  <code className="text-[11px]">trial_ends_at</code> (launch end),{" "}
                  <code className="text-[11px]">current_period_end</code> (billing end). One-time
                  launch claim is in{" "}
                  <code className="text-[11px]">organisation_launch_entitlements</code>. Set on
                  signup, plan change, or auto-filled when you open this page if missing.
                </p>
              </div>
            );
          })()}

          {!status?.booking_fees_waived && subscriptionInitialised && (
            <p className="text-xs text-gray-500">
              Fees are recorded when customer payments are verified through your gateway.
            </p>
          )}
        </CardContent>
      </Card>
        );
      })()}

      <Card className="overflow-hidden rounded-3xl border-gray-100 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-appointza-light to-orange-50/60">
          <CardTitle className="text-2xl font-bold text-appointza-navy">
            Pricing — simple &amp; clear
          </CardTitle>
          <CardDescription className="text-base text-gray-700">
            Every plan ships with the <strong>same Appointza feature set</strong>. The only thing
            that changes between tiers is the monthly price, the free-booking quota and the
            per-booking fee.
          </CardDescription>
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50/90 px-5 py-4 text-sm shadow-sm">
            <p className="font-semibold text-orange-950">Free signup</p>
            <p className="mt-1 text-orange-950/85">
              New organizations start with <strong>50 free bookings every month</strong> on the Free
              plan. Paid plans add more free bookings and lower per-booking fees.
            </p>
          </div>
        </CardHeader>
        <CardContent className="bg-white p-6 sm:p-8">
          {paidPlans.length === 0 ? (
            <p className="mb-6 text-sm text-muted-foreground">
              No paid plans found in <code className="text-xs">subscription_plans</code>. Seed or update the database and refresh.
            </p>
          ) : null}
          <div className="mb-8 overflow-x-auto rounded-2xl border border-zinc-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Monthly price</TableHead>
                  <TableHead className="text-right">Included bookings</TableHead>
                  <TableHead className="text-right">Effective cost / booking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPlans.map((plan) => {
                  const included = resolveFreeBookings(plan);
                  const pres = getPlanPresentation(plan);
                  return (
                    <TableRow key={plan.plan_code}>
                      <TableCell className="font-medium">{plan.display_name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {pres.monthlyPriceLabel}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {included.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {pres.effectiveCostPerBookingLabel}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PlanCards
            plans={paidPlans}
            currentPlanCode={status?.plan_code ?? ""}
            showFootnote={false}
            getCta={(plan, { isCurrent, isPopular }) => {
              const isBusy = changing !== null;
              return (
                <Button
                  type="button"
                  className={cn(
                    "w-full rounded-full py-6 text-sm font-extrabold",
                    isCurrent
                      ? "bg-zinc-200 text-zinc-800 hover:bg-zinc-200"
                      : isPopular
                        ? "bg-white text-zinc-950 hover:bg-white"
                        : "bg-zinc-950 text-white hover:bg-zinc-900",
                  )}
                  variant="default"
                  disabled={isCurrent || isBusy}
                  onClick={() => setPendingPlan(plan)}
                >
                  {changing === plan.plan_code ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Current plan
                    </>
                  ) : (
                    `Switch to ${plan.display_name}`
                  )}
                </Button>
              );
            }}
          />

          <p className="mt-6 text-xs text-gray-500">
            Plans are loaded from <strong>subscription_plans</strong> in your database. Add or edit
            rows there (set <code className="text-xs">isactive = TRUE</code>) and refresh this page.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-orange-600" />
            Monthly booking activity
          </CardTitle>
          <CardDescription>
            Appointments and event bookings for your organization (last 12 months)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingStats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Appointments
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {monthlyStats?.total_appointments?.toLocaleString("en-IN") ?? "0"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Event bookings
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {monthlyStats?.total_event_bookings?.toLocaleString("en-IN") ?? "0"}
                  </p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-orange-800/80">
                    Total
                  </p>
                  <p className="mt-1 text-2xl font-bold text-orange-950">
                    {(
                      (monthlyStats?.total_appointments ?? 0) +
                      (monthlyStats?.total_event_bookings ?? 0)
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {monthlyStats?.months && monthlyStats.months.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                        <TableHead className="font-semibold">Month</TableHead>
                        <TableHead className="text-right font-semibold">Appointments</TableHead>
                        <TableHead className="text-right font-semibold">Event bookings</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyStats.months.map((row) => (
                        <TableRow key={`${row.year}-${row.month}`}>
                          <TableCell className="font-medium text-gray-900">
                            {row.month_label ||
                              new Date(row.year, row.month - 1, 1).toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.appointment_count.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.event_booking_count.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-orange-700">
                            {row.total_bookings.toLocaleString("en-IN")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-500">
                  No booking activity in this period yet.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionBillingPanel;
