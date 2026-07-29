import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSubscriptionApiErrorMessage,
  SubscriptionService,
} from "@/services/subscription.service";
import type { CreditWalletStatusRes } from "@/models/subscription.model";
import { useWalletRecharge } from "@/hooks/useWalletRecharge";
import { Gift, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CreditWalletBillingPanelProps = {
  organisationId?: number;
  /** When true (profile billing), ensures billing mode is credit_wallet on load. */
  creditWalletOnly?: boolean;
};

export function CreditWalletBillingPanel({
  organisationId: organisationIdProp,
  creditWalletOnly = false,
}: CreditWalletBillingPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  const [wallet, setWallet] = useState<CreditWalletStatusRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const billingModeEnsured = useRef(false);

  const organisationId = organisationIdProp ?? user?.organisationid ?? 0;

  const loadWallet = useCallback(async () => {
    if (organisationId <= 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await subscriptionService.getWalletStatus(organisationId);
      setWallet(data);

      if (
        creditWalletOnly &&
        !billingModeEnsured.current &&
        data.billing_mode !== "credit_wallet"
      ) {
        billingModeEnsured.current = true;
        await subscriptionService.setBillingMode("credit_wallet", organisationId);
        const refreshed = await subscriptionService.getWalletStatus(organisationId);
        setWallet(refreshed);
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load Credit Wallet",
        description: getSubscriptionApiErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [creditWalletOnly, organisationId, subscriptionService, toast]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const { payingPackId, rechargePack } = useWalletRecharge({
    organisationId,
    onRecharged: async () => {
      await loadWallet();
    },
  });

  const handleClaimMonthlyFree = async () => {
    if (!wallet?.can_claim_monthly_free_credits) return;
    setClaiming(true);
    try {
      const updated = await subscriptionService.claimMonthlyFreeCredits(organisationId);
      setWallet(updated);
      toast({
        title: "Free credits claimed",
        description: `${updated.monthly_free_credits_amount} credits added to your wallet for this month.`,
      });
    } catch (e) {
      toast({
        title: "Could not claim free credits",
        description: getSubscriptionApiErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[10rem] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (organisationId <= 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        Credit Wallet is available for organization accounts. Sign in as the organization owner to
        manage booking credits.
      </div>
    );
  }

  const packs = wallet?.packs ?? [];
  const transactions = wallet?.recent_transactions ?? [];
  const creditsPerBooking = Math.max(1, wallet?.credits_per_booking ?? 1);

  const bookingsFromCredits = (credits: number) => Math.floor(credits / creditsPerBooking);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border-orange-100 bg-orange-50/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Wallet balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-appointza-navy">{wallet?.wallet_credit_balance ?? 0}</p>
            <p className="mt-1 text-sm text-gray-600">booking credits available</p>
            <p className="mt-2 text-xs text-gray-500">
              {creditsPerBooking} credit{creditsPerBooking === 1 ? "" : "s"} per booking
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-emerald-100 bg-emerald-50/50 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-emerald-600" />
              Free
            </CardTitle>
            <CardDescription>
              {wallet?.monthly_free_credits_claimed
                ? "5 free bookings claimed this month (₹0)."
                : "₹0 — claim 5 free booking credits once each calendar month."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              Each booking uses {creditsPerBooking} credit{creditsPerBooking === 1 ? "" : "s"} from your wallet
              balance. Recharge anytime for more credits — they stay until used.
            </p>
            <Button
              type="button"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!wallet?.can_claim_monthly_free_credits || claiming}
              onClick={() => void handleClaimMonthlyFree()}
            >
              {claiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : wallet?.monthly_free_credits_claimed ? (
                "Claimed this month"
              ) : (
                `Claim ${wallet?.monthly_free_credits_amount ?? 5} free credits`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-appointza-navy">Credit packs</h2>
            <p className="mt-1 text-sm text-gray-600">
              1 credit = 1 customer booking. Recharge via Razorpay — credits stay until used.
            </p>
          </div>
        </div>

        {/* Pricing table — desktop / tablet */}
        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-stone-200 sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3">Credit pack</th>
                <th className="px-4 py-3">Recharge</th>
                <th className="px-4 py-3">Booking credits</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr className="bg-emerald-50/40">
                <td className="px-4 py-3 font-medium text-appointza-navy">Free</td>
                <td className="px-4 py-3">₹0</td>
                <td className="px-4 py-3">5 free bookings / month</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                    disabled={!wallet?.can_claim_monthly_free_credits || claiming}
                    onClick={() => void handleClaimMonthlyFree()}
                  >
                    {claiming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : wallet?.monthly_free_credits_claimed ? (
                      "Claimed"
                    ) : (
                      "Claim free"
                    )}
                  </Button>
                </td>
              </tr>
              {packs.map((pack) => {
                const bookingCount = bookingsFromCredits(pack.credits);
                return (
                  <tr
                    key={pack.id}
                    className={pack.highlighted ? "bg-orange-50/50" : undefined}
                  >
                    <td className="px-4 py-3 font-medium text-appointza-navy">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {pack.name}
                        {pack.highlighted ? (
                          <Badge className="gap-0.5 bg-orange-600 hover:bg-orange-600">
                            <Star className="h-3 w-3 fill-current" />
                            Best value
                          </Badge>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-orange-700">
                      {pack.price_label || `₹${pack.price_inr.toLocaleString("en-IN")}`}
                    </td>
                    <td className="px-4 py-3">
                      {pack.credits.toLocaleString("en-IN")} credits
                      <span className="ml-1 text-stone-500">
                        (≈ {bookingCount} bookings)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-orange-600 hover:bg-orange-700"
                        disabled={payingPackId !== null}
                        onClick={() => void rechargePack(pack.id)}
                      >
                        {payingPackId === pack.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Recharge"
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cards — mobile */}
        <div className="mt-4 grid gap-4 sm:hidden">
          <Card className="rounded-2xl border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Free</CardTitle>
              <CardDescription>5 free bookings / month</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-xl font-bold text-emerald-800">₹0</p>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!wallet?.can_claim_monthly_free_credits || claiming}
                onClick={() => void handleClaimMonthlyFree()}
              >
                {wallet?.monthly_free_credits_claimed ? "Claimed" : "Claim free"}
              </Button>
            </CardContent>
          </Card>
          {packs.map((pack) => {
            const bookingCount = bookingsFromCredits(pack.credits);
            return (
              <Card
                key={pack.id}
                className={`rounded-2xl shadow-sm ${pack.highlighted ? "border-orange-400 ring-1 ring-orange-200" : "border-gray-100"}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {pack.name}
                    {pack.highlighted ? (
                      <Badge className="gap-0.5 bg-orange-600 hover:bg-orange-600">
                        <Star className="h-3 w-3 fill-current" />
                        Best value
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <CardDescription>
                    {pack.credits.toLocaleString("en-IN")} credits · ≈ {bookingCount} bookings
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="text-xl font-bold text-orange-600">
                    {pack.price_label || `₹${pack.price_inr.toLocaleString("en-IN")}`}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-orange-600 hover:bg-orange-700"
                    disabled={payingPackId !== null}
                    onClick={() => void rechargePack(pack.id)}
                  >
                    {payingPackId === pack.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Recharge"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {transactions.length > 0 && (
        <Card className="rounded-3xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent wallet activity</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-500">
                    {tx.created_at ? new Date(tx.created_at).toLocaleString("en-IN") : ""}
                  </p>
                </div>
                {tx.amount !== 0 && (
                  <span className={tx.amount > 0 ? "font-semibold text-emerald-600" : "font-semibold text-gray-900"}>
                    {tx.amount > 0 ? "+" : ""}
                    {Math.abs(tx.amount)} cr
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
