import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrganisationServices } from "@/models/organisationservices.model";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

type ServicePricingFieldsProps = {
  service: OrganisationServices;
  onChange: (patch: Partial<OrganisationServices>) => void;
  idPrefix?: string;
};

/**
 * Pricing form aligned with payment rules:
 * - Same price all days → one price + optional offer
 * - Different weekend price → weekday (Mon–Fri) + weekend (Sat–Sun), no offer
 */
export function ServicePricingFields({
  service,
  onChange,
  idPrefix = "",
}: ServicePricingFieldsProps) {
  const samePriceAllDays = !service.is_price_different;
  const pid = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  const applyWeekdayPrice = (price: number) => {
    onChange({
      prize: price,
      weekday_price: price,
      weekend_price: samePriceAllDays ? price : service.weekend_price || price,
    });
  };

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={pid("price")} className={org.label}>
          {samePriceAllDays ? "Price (₹) *" : "Regular price (Mon–Fri) (₹) *"}
        </Label>
        <Input
          id={pid("price")}
          type="number"
          min={0}
          value={service.prize.toString()}
          onChange={(e) => applyWeekdayPrice(parseInt(e.target.value, 10) || 0)}
          className={cn(org.input, "h-11 min-h-11")}
          placeholder="Enter price in ₹"
        />
        {samePriceAllDays ? (
          <p className="text-xs text-muted-foreground">
            Same rate applies Monday through Sunday. Offer price can apply on top of this.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Used for Monday–Friday bookings. Weekend uses the separate rate below.
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id={pid("same-price")}
          checked={samePriceAllDays}
          onCheckedChange={(checked) => {
            const isSame = checked === true;
            onChange({
              is_price_different: !isSame,
              weekday_price: service.prize,
              weekend_price: isSame ? service.prize : service.weekend_price || service.prize,
              // Offer only applies when same price all days
              offerprize: isSame ? service.offerprize : 0,
            });
          }}
        />
        <Label htmlFor={pid("same-price")} className="cursor-pointer text-sm font-normal">
          Same price for weekdays &amp; weekends
        </Label>
      </div>

      {!samePriceAllDays && (
        <div className="grid gap-2">
          <Label htmlFor={pid("weekend-price")} className={org.label}>Weekend price (Sat–Sun) (₹) *</Label>
          <Input
            id={pid("weekend-price")}
            type="number"
            min={0}
            value={service.weekend_price?.toString() || service.prize.toString() || "0"}
            onChange={(e) =>
              onChange({ weekend_price: parseInt(e.target.value, 10) || 0 })
            }
            className={cn(org.input, "h-11 min-h-11")}
            placeholder="Enter weekend price in ₹"
          />
          <p className="text-xs text-muted-foreground">
            Used for Saturday and Sunday bookings. Offer price is not used in this mode.
          </p>
        </div>
      )}

      {samePriceAllDays && (
        <div className="grid gap-2">
          <Label htmlFor={pid("offer-price")} className={org.label}>Offer price (₹) (optional)</Label>
          <Input
            id={pid("offer-price")}
            type="number"
            min={0}
            value={service.offerprize?.toString() || ""}
            onChange={(e) =>
              onChange({ offerprize: parseInt(e.target.value, 10) || 0 })
            }
            className={cn(org.input, "h-11 min-h-11")}
            placeholder="Leave empty if no offer"
          />
          <p className="text-xs text-muted-foreground">
            If set and lower than the regular price, customers pay the offer price when booking.
          </p>
        </div>
      )}
    </>
  );
}

export default ServicePricingFields;
