import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CreditWalletRechargeVerifyReq } from "@/models/subscription.model";
import {
  SubscriptionService,
  getSubscriptionApiErrorMessage,
} from "@/services/subscription.service";
import { loadScript } from "@/utils/razorpay.util";

interface UseWalletRechargeOptions {
  organisationId?: number;
  onRecharged?: (balance: number) => void | Promise<void>;
}

export function useWalletRecharge(opts: UseWalletRechargeOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  const [payingPackId, setPayingPackId] = useState<string | null>(null);

  const orgId = opts.organisationId ?? user?.organisationid ?? 0;

  const rechargePack = useCallback(
    async (packId: string) => {
      if (payingPackId) return;
      setPayingPackId(packId);
      try {
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        const order = await subscriptionService.createWalletRechargeOrder(
          packId,
          orgId > 0 ? orgId : undefined,
        );

        const RazorpayCtor = (
          window as unknown as { Razorpay?: new (opts: unknown) => { open: () => void } }
        ).Razorpay;
        if (!RazorpayCtor) {
          throw new Error("Razorpay checkout script could not be loaded.");
        }

        await new Promise<void>((resolve, reject) => {
          const rzp = new RazorpayCtor({
            key: order.razorpay_key,
            amount: order.amount_paise,
            currency: order.currency || "INR",
            name: "Appointza",
            description: `Credit Wallet · ${order.credits} booking credits`,
            order_id: order.razorpay_order_id,
            prefill: {
              name:
                [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim() ||
                user?.username ||
                "",
              email: user?.email ?? "",
              contact: user?.mobile ?? "",
            },
            theme: { color: "#ea580c" },
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                const payload = new CreditWalletRechargeVerifyReq();
                payload.organisation_id = orgId;
                payload.recharge_id = order.recharge_id;
                payload.razorpay_order_id = response.razorpay_order_id;
                payload.razorpay_payment_id = response.razorpay_payment_id;
                payload.razorpay_signature = response.razorpay_signature;
                const wallet = await subscriptionService.verifyWalletRecharge(payload);
                toast({
                  title: "Wallet recharged",
                  description: `${order.credits} credits added. Balance: ${wallet.wallet_credit_balance}.`,
                });
                if (opts.onRecharged) {
                  await opts.onRecharged(wallet.wallet_credit_balance);
                }
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => {
                reject(new Error("Payment was not completed."));
              },
            },
          });
          rzp.open();
        });
      } catch (err) {
        const message = getSubscriptionApiErrorMessage(err);
        if (message !== "Payment was not completed.") {
          toast({
            title: "Recharge failed",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        setPayingPackId(null);
      }
    },
    [payingPackId, subscriptionService, orgId, toast, user, opts],
  );

  return { payingPackId, rechargePack };
}
