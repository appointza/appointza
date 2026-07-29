import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBillingTopUp } from "@/hooks/useBillingTopUp";
import { useAuth } from "@/contexts/AuthContext";
import { OrganisationSubscriptionStatusRes } from "@/models/subscription.model";
import { resolveFreeBookingsByCode } from "@/utils/subscriptionPlanQuota";
import { AlertTriangle, CreditCard, Loader2, LogOut, ShieldCheck } from "lucide-react";

interface BillingOverdueScreenProps {
  status: OrganisationSubscriptionStatusRes;
  onPaid: () => void | Promise<void>;
}

const formatINR = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const BillingOverdueScreen = ({ status, onPaid }: BillingOverdueScreenProps) => {
  const { logout } = useAuth();
  const { paying, pay } = useBillingTopUp({
    organisationId: status.organisation_id,
    onPaid,
  });

  const amount = Number(status.outstanding_amount_inr ?? 0);
  const bookings = Number(status.unpaid_bookings_count ?? 0);
  const allowance = resolveFreeBookingsByCode(
    status.plan_code,
    status.free_bookings_per_month ?? 0,
  );
  const allowanceLabel = allowance > 0 ? allowance.toLocaleString("en-IN") : "Unlimited";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col items-center justify-center">
        <Card className="w-full overflow-hidden rounded-3xl border-red-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-500 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Payment required to continue</CardTitle>
                <CardDescription className="mt-1 text-red-50/90">
                  Your booking-fee overage is unpaid. Access to Appointza is on hold until this is
                  settled.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700/70">
                  Amount due
                </p>
                <p className="mt-2 text-3xl font-bold text-red-900">{formatINR(amount)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Bookings beyond free quota
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {bookings.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Current plan
                </p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {status.plan_display_name || status.plan_code || "—"}
                </p>
                <p className="mt-1 text-xs text-gray-500">{status.booking_fee_formula}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
              <p className="font-semibold">Why am I seeing this?</p>
              <p className="mt-1 text-amber-900/85">
                {status.plan_display_name} includes <strong>{allowanceLabel}</strong> free bookings
                per month. Once you cross the allowance, the per-booking platform fee applies. You
                currently have {bookings.toLocaleString("en-IN")} unsettled
                charge{bookings === 1 ? "" : "s"} totalling{" "}
                <strong>{formatINR(amount)}</strong>. Please pay to restore full access.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full bg-red-600 text-white hover:bg-red-700"
              disabled={paying || amount <= 0}
              onClick={() => void pay()}
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Opening Razorpay…
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay {formatINR(amount)} now
                </>
              )}
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Secure payment via Razorpay. Access is restored automatically after verification.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-800"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 max-w-2xl text-center text-xs text-gray-400">
          Need help? Contact support — once payment is received, your dashboard, appointments,
          events, and bookings unlock immediately.
        </p>
      </div>
    </div>
  );
};

export default BillingOverdueScreen;
