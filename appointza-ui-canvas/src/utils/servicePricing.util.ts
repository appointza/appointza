export type ServiceLike = {
  show_price?: boolean;
  prize?: number;
  weekday_price?: number;
  weekend_price?: number;
  is_price_different?: boolean;
  offerprize?: number;
};

export type ServicePriceBreakdown = {
  /** The actual price the customer pays for the given date (or chosen display context). */
  effectivePrice: number;
  /** Original/base price (weekday or weekend) before offer. */
  basePrice: number;
  isWeekend: boolean;
  isOfferApplied: boolean;
};

const WEEKEND_DAYS = new Set([0, 6]); // Sun=0, Sat=6

export function isWeekendDate(date: Date): boolean {
  return WEEKEND_DAYS.has(date.getDay());
}

function n(v: unknown): number {
  const x = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(x) ? x : 0;
}

/** Offer applies only when same price all days (`is_price_different` is false). */
export function isOfferPriceApplicable(service: ServiceLike): boolean {
  return service.is_price_different !== true && n(service.offerprize) > 0;
}

export function getServiceBasePriceForDate(service: ServiceLike, date: Date): number {
  const prize = n(service.prize);
  const weekday = n(service.weekday_price) || prize;
  const weekend = n(service.weekend_price) || prize;
  const different = service.is_price_different === true;
  const weekendDay = isWeekendDate(date);
  if (different && weekendDay) return weekend;
  if (different) return weekday;
  return prize > 0 ? prize : weekday;
}

/** Price charged for booking on `date` — matches service form rules. */
export function getServiceEffectivePriceForDate(service: ServiceLike, date: Date): ServicePriceBreakdown {
  if (service.show_price === false) {
    return { effectivePrice: 0, basePrice: 0, isWeekend: isWeekendDate(date), isOfferApplied: false };
  }
  const base = getServiceBasePriceForDate(service, date);
  const offer = n(service.offerprize);
  const offerApplied =
    service.is_price_different !== true && offer > 0 && offer < base;
  return {
    effectivePrice: offerApplied ? offer : base,
    basePrice: base,
    isWeekend: isWeekendDate(date),
    isOfferApplied: offerApplied,
  };
}

/** When you don't know the booking date (e.g. public template/services list). */
export function getServiceStartingPrice(service: ServiceLike): number {
  if (service.show_price === false) return 0;
  const prize = n(service.prize);
  const weekday = n(service.weekday_price) || prize;
  const weekend = n(service.weekend_price) || prize;
  const different = service.is_price_different === true;
  const baseMin = different ? Math.min(weekday || prize, weekend || prize) : (prize || weekday);
  const offer = n(service.offerprize);
  if (!different && offer > 0 && offer < baseMin) return offer;
  return baseMin;
}

export function getServicePriceSummary(service: ServiceLike): {
  startingPrice: number;
  weekday: number;
  weekend: number;
  offer: number;
  different: boolean;
} {
  const prize = n(service.prize);
  const weekday = n(service.weekday_price) || prize;
  const weekend = n(service.weekend_price) || prize;
  const offer = n(service.offerprize);
  const different = service.is_price_different === true;
  return {
    startingPrice: getServiceStartingPrice(service),
    weekday,
    weekend,
    offer,
    different,
  };
}

