import {
  appointzaRequest,
  readNumber,
  readString,
  unwrapAppointzaItem,
} from './appointzaHttp';
import { mapAppointzaEntitlement } from './appointzaEntitlement';
import { getAppointzaAccessToken } from './appointzaSession';
import type { RazorpayPackageId } from './razorpayPackages';
import { RAZORPAY_PACKAGES } from './razorpayPackages';
import type { NapzEntitlement } from '../entitlement/entitlementTypes';

export type AppointzaOrder = {
  orderId: string;
  key: string;
  amountPaise: number;
  currency: string;
  receipt: string;
};

export type RazorpayCheckoutSuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function createAppointzaOrder(
  packageId: RazorpayPackageId
): Promise<AppointzaOrder> {
  const selected = RAZORPAY_PACKAGES[packageId];
  const payload = await appointzaRequest('/api/Napz/CreateOrder', {
    body: { item: { package_id: packageId } },
  });
  const record = unwrapAppointzaItem(payload);
  const orderId = readString(record, ['orderId', 'orderid', 'OrderId', 'id']);
  const key = readString(record, ['key', 'Key', 'keyId', 'key_id']);
  const amount = readNumber(record, ['amountPaise', 'amount_paise', 'amount', 'Amount']);
  const currency = readString(record, ['currency', 'Currency']) || 'INR';
  const receipt = readString(record, ['receipt', 'Receipt']);
  if (!orderId.startsWith('order_') || !key) {
    throw new Error('Napz CreateOrder did not return a Razorpay order and key.');
  }
  return {
    orderId,
    key,
    amountPaise: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : selected.amountPaise,
    currency,
    receipt,
  };
}

export async function verifyAppointzaPayment(
  checkout: RazorpayCheckoutSuccess
): Promise<NapzEntitlement> {
  const payload = await appointzaRequest('/api/Napz/VerifyPayment', {
    body: {
      item: {
        razorpay_order_id: checkout.razorpay_order_id,
        razorpay_payment_id: checkout.razorpay_payment_id,
        razorpay_signature: checkout.razorpay_signature,
      },
    },
  });
  return mapAppointzaEntitlement(unwrapAppointzaItem(payload));
}

export async function fetchAppointzaEntitlement(): Promise<NapzEntitlement> {
  const token = await getAppointzaAccessToken();
  if (!token) {
    throw new Error('Sign in with Google again to load your Napz plan.');
  }
  const payload = await appointzaRequest('/api/Napz/GetEntitlement', {
    body: {},
  });
  return mapAppointzaEntitlement(unwrapAppointzaItem(payload));
}

export async function claimAppointzaFreeTrial(): Promise<NapzEntitlement> {
  const payload = await appointzaRequest('/api/Napz/ClaimFreeTrial', {
    body: {},
  });
  return mapAppointzaEntitlement(unwrapAppointzaItem(payload));
}
