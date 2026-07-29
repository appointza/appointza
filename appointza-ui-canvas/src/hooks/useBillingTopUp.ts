import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  PlatformTopUpVerifyReq,
} from "@/models/subscription.model";
import {
  SubscriptionService,
  getSubscriptionApiErrorMessage,
} from "@/services/subscription.service";
import { loadScript } from "@/utils/razorpay.util";

interface UseBillingTopUpOptions {
  /** Optional org id override. Defaults to the logged-in org user's id. */
  organisationId?: number;
  /** Called after Razorpay verifies and the server settles the ledger. */
  onPaid?: () => void | Promise<void>;
}

interface UseBillingTopUpResult {
  paying: boolean;
  pay: () => Promise<void>;
}

/**
 * Opens Razorpay checkout against the platform's Razorpay account to settle
 * outstanding booking-fee overage and verifies the signature on the server.
 */
export function useBillingTopUp(opts: UseBillingTopUpOptions = {}): UseBillingTopUpResult {
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionService = useMemo(() => new SubscriptionService(), []);
  const [paying, setPaying] = useState(false);

  const orgId = opts.organisationId ?? user?.organisationid ?? 0;

  const pay = useCallback(async () => {
    if (paying) return;
    setPaying(true);
    try {
      await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      const order = await subscriptionService.createTopUpOrder(orgId > 0 ? orgId : undefined);

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
          description: `Booking-fee top-up · ${order.bookings_covered} booking${order.bookings_covered === 1 ? "" : "s"}`,
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
              const payload = new PlatformTopUpVerifyReq();
              payload.organisation_id = orgId;
              payload.topup_id = order.topup_id;
              payload.razorpay_order_id = response.razorpay_order_id;
              payload.razorpay_payment_id = response.razorpay_payment_id;
              payload.razorpay_signature = response.razorpay_signature;
              await subscriptionService.verifyTopUp(payload);
              toast({
                title: "Payment received",
                description: `₹${order.amount_inr.toLocaleString("en-IN")} settled. Outstanding fees cleared.`,
              });
              if (opts.onPaid) {
                await opts.onPaid();
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
          title: "Could not complete payment",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setPaying(false);
    }
  }, [paying, subscriptionService, orgId, toast, user, opts]);

  return { paying, pay };
}
