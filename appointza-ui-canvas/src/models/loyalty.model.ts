export type LoyaltyRewardType =
  | "free_service"
  | "percentage_discount"
  | "fixed_discount"
  | "loyalty_points"
  | "free_addon"
  | "coupon"
  | "cashback"
  | "upgrade";

export type LoyaltyTriggerType =
  | "completed_services"
  | "spend_amount"
  | "points_earned"
  | "purchases_in_period";

export type LoyaltyApplyOn = "next_service" | "current_service" | "wallet" | "coupon";

export class OrganisationLoyaltySettings {
  organisation_id = 0;
  points_per_service = 0;
  points_per_rupee_spent = 0;
  bonus_points = 0;
  referral_points = 0;
  birthday_bonus_points = 0;
  anniversary_bonus_points = 0;
  redemption_points_per_rupee = 100;
  redemption_rupee_value = 50;
  min_redemption_points = 100;
  points_expiry_days = 365;
  max_points_per_transaction = 0;
  combine_with_discounts = false;
  allow_transfer = false;
  allow_partial_redemption = true;
  isactive = true;
}

export class LoyaltyRule {
  id = 0;
  organisation_id = 0;
  scheme_id = 0;
  name = "";
  trigger_type: LoyaltyTriggerType = "completed_services";
  trigger_operator = ">=";
  trigger_value = 0;
  trigger_period_days = 0;
  reward_type: LoyaltyRewardType = "percentage_discount";
  reward_value = 0;
  apply_on: LoyaltyApplyOn = "next_service";
  max_discount_amount = 0;
  reward_expiry_days = 30;
  free_service_id = 0;
  priority = 0;
  isactive = true;
}

export class LoyaltyScheme {
  id = 0;
  organisation_id = 0;
  name = "";
  description = "";
  status: "active" | "inactive" = "inactive";
  start_date = "";
  end_date = "";
  eligible_customer_ids: number[] = [];
  eligible_service_ids: number[] = [];
  min_completed_services = 0;
  reward_type: LoyaltyRewardType = "loyalty_points";
  reward_value = 0;
  max_reward_limit = 0;
  reward_expiry_days = 30;
  terms_and_conditions = "";
  sort_order = 0;
  isactive = true;
  rules: LoyaltyRule[] = [];
}

export class LoyaltyTier {
  id = 0;
  organisation_id = 0;
  name = "";
  min_services = 0;
  max_services: number | null = null;
  discount_percent = 0;
  benefits: string[] = [];
  sort_order = 0;
  isactive = true;
}

export class ClientLoyaltyWallet {
  id = 0;
  organisation_id = 0;
  client_user_id = 0;
  client_name?: string;
  client_mobile?: string;
  current_points = 0;
  total_points_earned = 0;
  total_points_redeemed = 0;
  completed_services_count = 0;
  total_spend = 0;
  current_tier_id?: number | null;
  current_tier_name?: string;
  recent_transactions: LoyaltyPointTransaction[] = [];
  available_rewards: LoyaltyRewardGrant[] = [];
}

export class LoyaltyPointTransaction {
  id = 0;
  organisation_id = 0;
  client_user_id = 0;
  transaction_type = "";
  points_delta = 0;
  balance_after = 0;
  reference_type = "";
  reference_id = 0;
  description = "";
  created_at = "";
}

export class LoyaltyRewardGrant {
  id = 0;
  organisation_id = 0;
  client_user_id = 0;
  scheme_id?: number;
  rule_id?: number;
  reward_type = "";
  reward_value = 0;
  status = "available";
  apply_on = "";
  max_discount_amount = 0;
  coupon_code = "";
  granted_at = "";
  expires_at?: string;
  redeemed_at?: string;
}

export class LoyaltyDashboard {
  organisation_id = 0;
  active_schemes = 0;
  total_schemes = 0;
  enrolled_customers = 0;
  points_issued = 0;
  points_redeemed = 0;
  available_rewards = 0;
  settings: OrganisationLoyaltySettings = new OrganisationLoyaltySettings();
}

export const REWARD_TYPE_OPTIONS: { value: LoyaltyRewardType; label: string }[] = [
  { value: "free_service", label: "Free service" },
  { value: "percentage_discount", label: "Percentage discount" },
  { value: "fixed_discount", label: "Fixed amount discount" },
  { value: "loyalty_points", label: "Loyalty points" },
  { value: "free_addon", label: "Free add-on" },
  { value: "coupon", label: "Coupon" },
  { value: "cashback", label: "Cashback" },
  { value: "upgrade", label: "Upgrade" },
];

export const TRIGGER_TYPE_OPTIONS: { value: LoyaltyTriggerType; label: string }[] = [
  { value: "completed_services", label: "Completed services" },
  { value: "spend_amount", label: "Spend amount (₹)" },
  { value: "points_earned", label: "Points earned" },
  { value: "purchases_in_period", label: "Purchases in period" },
];

export const APPLY_ON_OPTIONS: { value: LoyaltyApplyOn; label: string }[] = [
  { value: "next_service", label: "Next service" },
  { value: "current_service", label: "Current service" },
  { value: "wallet", label: "Wallet (points)" },
  { value: "coupon", label: "Generate coupon" },
];
