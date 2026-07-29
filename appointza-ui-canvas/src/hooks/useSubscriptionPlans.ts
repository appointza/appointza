import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/models/subscription.model";
import { SubscriptionService } from "@/services/subscription.service";

/**
 * Loads active subscription plans from PostgreSQL via /Subscription/SelectPlans.
 * No frontend fallback — empty list means DB/API has no active plans.
 */
export function useSubscriptionPlans(projectName = "appointza") {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const service = new SubscriptionService();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await service.selectPlans(projectName);
        if (cancelled) return;
        setPlans(
          [...list]
            .filter((p) => p.isactive !== false)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        );
      } catch (e) {
        if (cancelled) return;
        setPlans([]);
        setError(e instanceof Error ? e.message : "Could not load pricing plans.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectName]);

  return { plans, loading, error };
}
