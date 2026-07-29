import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stayApi } from "@/services/stay.service";
import { keysToCamelCase } from "@/models/organisationProfile";
import { Loader2, Wallet, Gift, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadScript } from "@/utils/razorpay.util";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface CreditsPageData {
  account?: { billingMode?: string; transactions?: { description: string; amount: number; createdAt: string; type?: string }[] };
  walletCreditBalance?: number;
  walletFreeBookingsRemaining?: number;
  walletFreeBookingsUsedThisMonth?: number;
  creditsPerBooking?: number;
  walletPacks?: { id: string; name: string; description?: string; priceInr?: number; priceLabel?: string; credits: number; creditsLabel?: string; highlighted?: boolean }[];
  referral?: {
    referralCode?: string;
    successfulReferrals?: number;
    bonusCreditsPerReferral?: number;
    referralAlreadyApplied?: boolean;
    canApplyReferralCode?: boolean;
  };
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  }
  return 0;
}

export default function CreditsPage() {
  const { toast } = useToast();
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [walletModeEnsured, setWalletModeEnsured] = useState(false);
  const [payingPackId, setPayingPackId] = useState<string | null>(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => keysToCamelCase(await stayApi.credits.index()) as CreditsPageData,
  });

  const walletPacks = data?.walletPacks || [];
  const transactions = data?.account?.transactions || [];
  const referral = data?.referral;
  const referralAlreadyApplied = referral?.referralAlreadyApplied || referral?.canApplyReferralCode === false;

  useEffect(() => {
    if (isLoading || walletModeEnsured) return;
    if ((data?.account?.billingMode || "").toLowerCase() === "credit_wallet") {
      setWalletModeEnsured(true);
      return;
    }

    let cancelled = false;
    void stayApi.credits.setBillingMode("credit_wallet").then(() => {
      if (cancelled) return;
      setWalletModeEnsured(true);
      refetch();
    }).catch(() => {
      if (!cancelled) setWalletModeEnsured(true);
    });

    return () => {
      cancelled = true;
    };
  }, [data?.account?.billingMode, isLoading, refetch, walletModeEnsured]);

  const recharge = async (packId: string) => {
    setPayingPackId(packId);
    try {
      const orderRaw = keysToCamelCase(
        await stayApi.credits.createWalletRechargeOrder(packId)
      ) as Record<string, unknown>;

      const orderId = pickStr(orderRaw, "orderId");
      const key = pickStr(orderRaw, "key");
      const rechargeId = pickStr(orderRaw, "rechargeId");
      const amount = pickNum(orderRaw, "amount");
      const amountPaise = pickNum(orderRaw, "amountPaise") || Math.round(amount * 100);
      const credits = pickNum(orderRaw, "credits");

      if (!orderId || !key || !rechargeId) {
        throw new Error("Could not create Razorpay order.");
      }

      await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!window.Razorpay) throw new Error("Razorpay checkout failed to load.");

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key,
          amount: amountPaise,
          currency: pickStr(orderRaw, "currency") || "INR",
          name: pickStr(orderRaw, "propertyName") || "AppointzaStay",
          description: `Credit Wallet — ${credits || ""} booking credits`,
          order_id: orderId,
          theme: { color: "#0f766e" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verified = keysToCamelCase(
                await stayApi.credits.verifyWalletRecharge({
                  rechargeId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                })
              ) as Record<string, unknown>;

              toast({
                title: "Wallet recharged",
                description: pickStr(verified, "message") || "Credits added after successful payment.",
              });
              refetch();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              toast({
                title: "Payment cancelled",
                description: "No credits were added.",
                variant: "destructive",
              });
              resolve();
            },
          },
        });
        rzp.open();
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      toast({
        title: "Payment failed",
        description: err?.response?.data?.error || err?.message || "Could not complete wallet recharge.",
        variant: "destructive",
      });
    } finally {
      setPayingPackId(null);
    }
  };

  const copyReferralCode = async () => {
    if (!referral?.referralCode) return;
    try {
      await navigator.clipboard.writeText(referral.referralCode);
      toast({ title: "Copied", description: "Referral code copied to clipboard." });
    } catch {
      toast({ title: "Could not copy", description: "Please copy the code manually.", variant: "destructive" });
    }
  };

  const applyReferral = async () => {
    const code = referralCodeInput.trim();
    if (!code) return;
    setIsApplyingReferral(true);
    try {
      const result = await stayApi.credits.applyReferral(code) as { success?: boolean; message?: string };
      toast({ title: "Referral applied", description: result?.message || "Referral code applied successfully." });
      setReferralCodeInput("");
      refetch();
    } catch (error) {
      const message =
        typeof error === "object" && error && "response" in error
          ? String((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Could not apply referral code.")
          : "Could not apply referral code.";
      toast({ title: "Referral failed", description: message, variant: "destructive" });
    } finally {
      setIsApplyingReferral(false);
    }
  };

  return (
    <StaffLayout>
      <div className="space-y-8 max-w-6xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Billing</p>
          <h1 className="text-2xl font-semibold">Credit Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Website, hosting, domain, and SSL are included. Just recharge booking credits and use them — no separate
            build or maintenance fees.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="w-4 h-4" />
                Wallet balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {isLoading ? "—" : data?.walletCreditBalance ?? 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">booking credits available</p>
              <p className="text-xs text-muted-foreground mt-2">
                {data?.creditsPerBooking ?? 1} credit(s) per booking
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="w-4 h-4 text-primary" />
                Signup bonus
              </CardTitle>
              <CardDescription>
                New properties get 30 free booking credits once at signup — not every month.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your wallet balance above includes any unused signup credits. When credits run out, recharge a plan to keep
              accepting bookings. Website, hosting, and SSL stay included.
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="w-4 h-4 text-primary" />
                Reference code
              </CardTitle>
              <CardDescription>
                Share this code with another business. When they use it, both of you receive 5 free booking credits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading reference code...
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input readOnly value={referral?.referralCode || ""} className="font-mono font-semibold tracking-wide" />
                    <Button type="button" variant="outline" onClick={copyReferralCode} disabled={!referral?.referralCode}>
                      <Copy className="mr-2 w-4 h-4" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Successful referrals: <span className="font-semibold text-foreground">{referral?.successfulReferrals ?? 0}</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Referral code</CardTitle>
              <CardDescription>
                Have a code from another business? Enter it once here. Both of you receive 5 free booking credits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking referral status...
                </div>
              ) : referralAlreadyApplied ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Referral code already applied for this organization.
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="referral-code">Referral code (one time)</Label>
                    <Input
                      id="referral-code"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      placeholder="STAY-XXXXXXXX"
                      autoComplete="off"
                      className="mt-2"
                    />
                  </div>
                  <Button type="button" onClick={() => void applyReferral()} disabled={isApplyingReferral || !referralCodeInput.trim()}>
                    {isApplyingReferral ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      "Apply code"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="font-semibold mb-1">Recharge &amp; use</h2>
          <p className="text-sm text-muted-foreground mb-4">
            No website build, hosting, or maintenance charges. Pay with Razorpay — credits are added after payment and
            used as guests book.
          </p>
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {walletPacks.map((pack) => (
                <Card key={pack.id} className={pack.highlighted ? "border-primary ring-1 ring-primary/20" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-2xl font-bold text-primary">{pack.priceLabel || `₹${pack.priceInr}`}</p>
                    <p className="text-sm font-medium">{pack.credits.toLocaleString("en-IN")} included bookings</p>
                    <Button className="w-full" onClick={() => void recharge(pack.id)} disabled={payingPackId !== null}>
                      {payingPackId === pack.id ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Opening Razorpay...
                        </>
                      ) : (
                        "Pay & recharge"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {transactions.slice(0, 8).map((tx, i) => (
                <div key={i} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  {tx.amount !== 0 && (
                    <span className={tx.amount > 0 ? "text-emerald-600 font-semibold" : "font-semibold"}>
                      {tx.amount > 0 ? "+" : ""}
                      {tx.type?.startsWith("wallet") ? `${Math.abs(tx.amount)} cr` : `₹${Math.abs(tx.amount)}`}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
}
