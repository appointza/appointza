import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ALL_CATALOG_OFFERING_KINDS,
  CATALOG_OFFERING_LABELS,
  type CatalogOfferingKind,
} from "@/utils/organisationCatalogOfferings.util";

type Props = {
  value: CatalogOfferingKind[];
  onChange: (next: CatalogOfferingKind[]) => void;
};

export function OrganisationCatalogOfferingsSelector({ value, onChange }: Props) {
  const toggle = (kind: CatalogOfferingKind, checked: boolean) => {
    if (checked) {
      onChange([...value, kind].filter((k, i, arr) => arr.indexOf(k) === i));
      return;
    }
    onChange(value.filter((k) => k !== kind));
  };

  return (
    <div className="space-y-2">
      <Label>What you provide</Label>
      <p className="text-xs text-stone-500">
        Select everything you want customers to book — services, events, and/or room stays.
      </p>
      <div className="mt-2 grid grid-cols-1 gap-3 rounded-xl border border-stone-200 p-4 sm:grid-cols-3">
        {ALL_CATALOG_OFFERING_KINDS.map((kind) => (
          <div key={kind} className="flex items-start gap-2">
            <Checkbox
              id={`catalog-offering-${kind}`}
              checked={value.includes(kind)}
              onCheckedChange={(checked) => toggle(kind, checked === true)}
            />
            <label
              htmlFor={`catalog-offering-${kind}`}
              className="cursor-pointer text-sm font-medium leading-snug text-stone-800"
            >
              {CATALOG_OFFERING_LABELS[kind]}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
