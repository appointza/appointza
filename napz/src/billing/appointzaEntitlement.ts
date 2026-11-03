import {
  FREE_ENTITLEMENT,
  type NapzEntitlement,
} from '../entitlement/entitlementTypes';
import type { NapzSubscriptionTier } from '../subscription/subscriptionTier';
import { FREE_TRIAL_PLAN_ID } from '../subscription/subscriptionTier';
import { readBool, readString } from './appointzaHttp';

function tierFromBackend(record: Record<string, unknown>): NapzSubscriptionTier {
  const tier = readString(record, ['tier', 'Tier']).toLowerCase();
  if (tier === 'lifetime') return 'lifetime';
  if (tier === 'premium') return 'premium';
  if (readBool(record, ['is_lifetime', 'isLifetime', 'IsLifetime'])) return 'lifetime';
  if (readBool(record, ['is_premium', 'isPremium', 'premium'])) return 'premium';
  return 'free';
}

export function tierFromEntitlement(entitlement: NapzEntitlement): NapzSubscriptionTier {
  if (entitlement.premium && entitlement.tier !== 'free') {
    return entitlement.tier;
  }
  if (entitlement.premium) {
    return entitlement.isLifetime ? 'lifetime' : 'premium';
  }
  return 'free';
}

/** Map NapzController entitlement JSON into the app's NapzEntitlement shape. */
export function mapAppointzaEntitlement(raw: unknown): NapzEntitlement {
  if (!raw || typeof raw !== 'object') return FREE_ENTITLEMENT;
  const record = raw as Record<string, unknown>;

  const isLifetime = readBool(record, ['is_lifetime', 'isLifetime', 'IsLifetime']);
  let tier = tierFromBackend(record);
  if (isLifetime) tier = 'lifetime';

  const expiresRaw = readString(record, ['expires_at', 'expiresAt', 'ExpiresAt']);
  const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : null;
  const productId = readString(record, ['product_id', 'productId', 'ProductId']) || null;
  const freeTrialUsed =
    readBool(record, ['free_trial_used', 'freeTrialUsed', 'FreeTrialUsed']) ||
    productId === FREE_TRIAL_PLAN_ID;

  const premium =
    isLifetime ||
    readBool(record, ['is_premium', 'isPremium', 'premium']) ||
    (tier === 'premium' && (!expiresAt || Date.parse(expiresAt) > Date.now()));

  if (!premium && !isLifetime) {
    return {
      ...FREE_ENTITLEMENT,
      productId: null,
      lastVerifiedAt: new Date().toISOString(),
      freeTrialUsed,
    };
  }

  return {
    premium: true,
    tier: isLifetime ? 'lifetime' : 'premium',
    productId,
    planId: productId,
    status: 'active',
    expiresAt: isLifetime ? null : expiresAt,
    isLifetime,
    autoRenewing: false,
    renewalStatus: 'NONE',
    lastVerifiedAt: new Date().toISOString(),
    freeTrialUsed,
  };
}
