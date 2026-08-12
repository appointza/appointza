import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CreditWalletBillingPanelProps = {
  organisationId?: number;
};

export function CreditWalletBillingPanel({ organisationId: organisationIdProp }: CreditWalletBillingPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  const [wallet, setWallet] = useState<CreditWalletStatusRes | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [organisationId, subscriptionService, toast]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const { payingPackId, rechargePack } = useWalletRecharge({
    organisationId,
    onRecharged: async () => {
      await loadWallet();
    },
  });

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
  const signupCredits = wallet?.signup_free_credits ?? 50;

  const bookingsFromCredits = (credits: number) => Math.floor(credits / creditsPerBooking);

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-orange-100 bg-orange-50/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500">Wallet balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-appointza-navy">{wallet?.wallet_credit_balance ?? 0}</p>
          <p className="mt-1 text-sm text-gray-600">booking credits available</p>
          <p className="mt-2 text-xs text-gray-500">
            {signupCredits} free credits are added once when you sign in. Each booking uses{" "}
            {creditsPerBooking} credit{creditsPerBooking === 1 ? "" : "s"}. Recharge below when you need more.
          </p>
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-appointza-navy">Credit packs</h2>
            <p className="mt-1 text-sm text-gray-600">
              1 credit = 1 customer booking. Recharge via Razorpay — credits stay until used.
            </p>
          </div>
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-stone-200 sm:block">
          {packs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-stone-500">
              No recharge packs in <code className="text-xs">subscription_plans</code>. Add paid plans there
              (monthly_price_inr &gt; 0) and refresh.
            </div>
          ) : (
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
                      <span className="ml-1 text-stone-500">(≈ {bookingCount} bookings)</span>
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
          )}
        </div>

        <div className="mt-4 grid gap-4 sm:hidden">
          {packs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
              No recharge packs in subscription_plans yet.
            </div>
          ) : null}
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
