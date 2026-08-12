export class SubscriptionPlanSelectReq {
  project_name: string = "";
}

export class SubscriptionPlan {
  id: number = 0;
  plan_code: string = "";
  project_name: string = "appointza";
  display_name: string = "";
  monthly_price_inr: number = 0;
  booking_fee_inr: number = 0;
  booking_fee_percent: number = 0;
  trial_days: number = 0;
  /** Free bookings per calendar month. 0 = unlimited. */
  free_bookings_per_month: number = 0;
  sort_order: number = 0;
  isactive: boolean = true;
}

export class OrganisationSubscriptionSelectReq {
  organisation_id: number = 0;
}

export class OrganisationSubscriptionChangePlanReq {
  organisation_id: number = 0;
  plan_code: string = "";
}

export class OrganisationMonthlyBookingStatsReq {
  organisation_id: number = 0;
  months: number = 12;
}

export class OrganisationMonthlyBookingStatsRow {
  year: number = 0;
  month: number = 0;
  month_label: string = "";
  appointment_count: number = 0;
  event_booking_count: number = 0;
  total_bookings: number = 0;
}

export class OrganisationMonthlyBookingStatsRes {
  organisation_id: number = 0;
  months: OrganisationMonthlyBookingStatsRow[] = [];
  total_appointments: number = 0;
  total_event_bookings: number = 0;
}

export class OrganisationSubscriptionStatusRes {
  organisation_id: number = 0;
  plan_code: string = "";
  plan_display_name: string = "";
  status: string = "";
  is_in_trial: boolean = false;
  booking_fees_waived: boolean = false;
  trial_days_remaining: number | null = null;
  trial_ends_at: string | null = null;
  monthly_price_inr: number = 0;
  booking_fee_inr: number = 0;
  booking_fee_percent: number = 0;
  booking_fee_formula: string = "";
  launch_offer_availed: boolean = false;
  launch_offer_availed_at: string | null = null;
  launch_offer_available: boolean = false;
  launch_trial_days: number = 0;
  plan_started_at: string | null = null;
  plan_ends_at: string | null = null;
  current_period_start: string | null = null;
  current_period_end: string | null = null;
  subscription_created_at: string | null = null;
  period_type: string = "";
  free_bookings_per_month: number = 0;
  free_bookings_used_this_month: number = 0;
  free_bookings_remaining: number | null = null;
  free_bookings_unlimited: boolean = false;
  outstanding_amount_inr: number = 0;
  unpaid_bookings_count: number = 0;
  billing_mode: string = "subscription";
  wallet_credit_balance: number = 0;
  credits_per_booking: number = 1;
}

export class PlatformTopUpDueRes {
  organisation_id: number = 0;
  plan_code: string = "";
  outstanding_amount_inr: number = 0;
  unpaid_bookings_count: number = 0;
  can_pay: boolean = false;
}

export class PlatformTopUpOrderRes {
  topup_id: number = 0;
  razorpay_order_id: string = "";
  razorpay_key: string = "";
  amount_paise: number = 0;
  amount_inr: number = 0;
  currency: string = "INR";
  receipt: string = "";
  bookings_covered: number = 0;
}

export class PlatformTopUpVerifyReq {
  organisation_id: number = 0;
  topup_id: number = 0;
  razorpay_order_id: string = "";
  razorpay_payment_id: string = "";
  razorpay_signature: string = "";
}

export class CreditWalletPack {
  id: string = "";
  name: string = "";
  description: string = "";
  price_inr: number = 0;
  credits: number = 0;
  highlighted: boolean = false;
  price_label?: string;
  credits_label?: string;
}

export class CreditWalletTransaction {
  id: number = 0;
  type: string = "";
  amount: number = 0;
  description: string = "";
  created_at: string = "";
}

export class CreditWalletStatusRes {
  organisation_id: number = 0;
  billing_mode: string = "subscription";
  wallet_credit_balance: number = 0;
  signup_free_credits: number = 50;
  credits_per_booking: number = 1;
  packs: CreditWalletPack[] = [];
  recent_transactions: CreditWalletTransaction[] = [];
}

export class CreditWalletBillingModeReq {
  organisation_id: number = 0;
  mode: string = "subscription";
}

export class CreditWalletRechargeReq {
  organisation_id: number = 0;
  pack_id: string = "";
}

export class CreditWalletRechargeOrderRes {
  recharge_id: number = 0;
  pack_id: string = "";
  credits: number = 0;
  razorpay_order_id: string = "";
  razorpay_key: string = "";
  amount_paise: number = 0;
  amount_inr: number = 0;
  currency: string = "INR";
  receipt: string = "";
}

export class CreditWalletRechargeVerifyReq {
  organisation_id: number = 0;
  recharge_id: number = 0;
  razorpay_order_id: string = "";
  razorpay_payment_id: string = "";
  razorpay_signature: string = "";
}
