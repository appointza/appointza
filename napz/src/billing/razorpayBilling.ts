import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_PROFILE_KEY } from '../constants/authStorage';
import { isPremium } from '../entitlement/PremiumGate';
import type { NapzEntitlement } from '../entitlement/entitlementTypes';
import {
  claimAppointzaFreeTrial,
  createAppointzaOrder,
  fetchAppointzaEntitlement,
  verifyAppointzaPayment,
} from './appointzaPaymentApi';
import { getAppointzaAccessToken } from './appointzaSession';
import {
  CheckoutCancelledError,
  openRazorpayCheckout,
} from './RazorpayNativeCheckout';
import { RAZORPAY_PACKAGES, type RazorpayPackageId } from './razorpayPackages';

export { CheckoutCancelledError };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function tenDigitMobile(mobile: string): string | undefined {
  const digits = digitsOnly(mobile);
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return undefined;
}

async function loadCheckoutPrefill(): Promise<{
  name?: string;
  email?: string;
  contact?: string;
}> {
  let mobile = '';
  let name = '';
  let email = '';
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        mobile?: string;
        name?: string;
        email?: string;
      };
      mobile = String(parsed.mobile ?? '');
      name = String(parsed.name ?? '');
      email = String(parsed.email ?? '');
    }
  } catch {
    /* keep empty */
  }
  return {
    name: name.trim() || undefined,
    email: email.trim() || undefined,
    contact: tenDigitMobile(mobile),
  };
}

function entitlementAdvanced(before: NapzEntitlement, next: NapzEntitlement): boolean {
  if (!isPremium(next)) return false;
  if (next.isLifetime && !before.isLifetime) return true;
  if (next.expiresAt && next.expiresAt !== before.expiresAt) return true;
  if (next.productId && next.productId !== before.productId) return true;
  return isPremium(next) && !isPremium(before);
}

export function describeBillingError(error: unknown): string {
  if (error instanceof CheckoutCancelledError) return '';
  const message = String((error as Error)?.message ?? error);
  if (/sign in|unauthorized|session|token/i.test(message)) {
    return 'Sign in with Google again, then try Premium checkout.';
  }
  if (/Unknown Napz package/i.test(message)) {
    return 'That plan is not available yet. Pick another Premium package.';
  }
  if (/free trial already used/i.test(message)) {
    return 'This account has already used the 10-day free trial.';
  }
  if (/Premium is already active/i.test(message)) {
    return 'Premium is already active on this account.';
  }
  return message.replace(/^\[.*?\]\s*/, '') || 'Could not start Razorpay checkout.';
}

/** Source of truth for Napz Premium — Appointza `/api/Napz/*` only. */
export async function fetchBillingEntitlement(): Promise<NapzEntitlement> {
  return fetchAppointzaEntitlement();
}

/** @deprecated use fetchBillingEntitlement */
export async function confirmLatestRazorpayOrder(): Promise<NapzEntitlement> {
  return fetchBillingEntitlement();
}

export async function startFreeTrial(): Promise<NapzEntitlement> {
  const token = await getAppointzaAccessToken();
  if (!token) {
    throw new Error('Sign in with Google again to start the free trial.');
  }
  return claimAppointzaFreeTrial();
}

export async function startRazorpayCheckout(
  packageId: RazorpayPackageId
): Promise<NapzEntitlement> {
  const token = await getAppointzaAccessToken();
  if (!token) {
    throw new Error('Sign in with Google again to unlock Premium checkout.');
  }

  const before = await fetchAppointzaEntitlement();
  const selected = RAZORPAY_PACKAGES[packageId];
  const prefill = await loadCheckoutPrefill();
  const order = await createAppointzaOrder(packageId);

  const checkout = await openRazorpayCheckout({
    key: order.key,
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    description: selected.name,
    prefillEmail: prefill.email,
    prefillName: prefill.name,
    prefillContact: prefill.contact,
  });

  const granted = await verifyAppointzaPayment(checkout);
  if (entitlementAdvanced(before, granted) || isPremium(granted)) {
    return granted;
  }
  return fetchAppointzaEntitlement();
}
