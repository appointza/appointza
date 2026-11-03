import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getAppointzaAccessToken } from '../billing/appointzaSession';
import { useSubscriptionTier } from '../context/SubscriptionTierContext';

/** Verify with Appointza when the local plan end date has passed. */
export function EntitlementForegroundRefresh() {
  const { ensureSubscriptionCurrent } = useSubscriptionTier();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void (async () => {
        if (!(await getAppointzaAccessToken())) return;
        await ensureSubscriptionCurrent().catch(() => {});
      })();
    });
    return () => sub.remove();
  }, [ensureSubscriptionCurrent]);

  return null;
}
