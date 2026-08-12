import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganisationType } from "@/models/organisation.model";

export const ORGANISATION_TYPE_HELP: Record<
  OrganisationType,
  { title: string; summary: string; examples: string; includes: string[] }
> = {
  service: {
    title: "Service business only",
    summary:
      "For appointment-based businesses that sell time slots, services, or events — not overnight stays.",
    examples: "Salons, clinics, tutors, fitness studios, event organizers",
    includes: [
      "Services & events catalog",
      "Appointment calendar & bookings",
      "Customer management",
    ],
  },
  hospitality: {
    title: "Hospitality / stay property",
    summary:
      "For properties that rent rooms or spaces by night or hour, with guest check-in and housekeeping.",
    examples: "Hotels, resorts, homestays, villas, party halls, lodges",
    includes: [
      "Room definitions & status board",
      "Packages, food menu, nearby places",
      "Guest services & stay content",
    ],
  },
  both: {
    title: "Both service and hospitality",
    summary:
      "For businesses that run booked services and also offer rooms or stay packages under one brand.",
    examples: "Resort with spa, hotel with restaurant events, wellness retreat with treatments + rooms",
    includes: [
      "Everything in service mode",
      "Everything in hospitality mode",
      "One organisation, both workflows",
    ],
  },
};

export function organisationTypeLabel(type: OrganisationType | string | undefined): string {
  const key = (type ?? "service") as OrganisationType;
  return ORGANISATION_TYPE_HELP[key]?.title ?? "Service business only";
}

function OrganisationTypeHelpContent({ highlightType }: { highlightType?: OrganisationType }) {
  return (
    <div className="space-y-4">
      {(Object.keys(ORGANISATION_TYPE_HELP) as OrganisationType[]).map((type) => {
        const help = ORGANISATION_TYPE_HELP[type];
        const isHighlighted = highlightType === type;
        return (
          <div
            key={type}
            className={isHighlighted ? "rounded-lg bg-orange-50/80 p-2 -mx-2" : undefined}
          >
            <p className="text-sm font-semibold text-stone-900">{help.title}</p>
            <p className="mt-1 text-sm text-stone-600">{help.summary}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-stone-500">Good for</p>
            <p className="mt-0.5 text-sm text-stone-700">{help.examples}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-stone-500">Includes</p>
            <ul className="mt-1 space-y-0.5">
              {help.includes.map((item) => (
                <li key={item} className="text-sm text-stone-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

type OrganisationTypeSelectorProps = {
  value: OrganisationType;
  onChange: (value: OrganisationType) => void;
};

export function OrganisationTypeSelector({ value, onChange }: OrganisationTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="organisation-type">Organisation type</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-stone-500 hover:text-stone-700"
              aria-label="Organisation type help"
            >
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(calc(100vw-2rem),22rem)] max-h-[min(70vh,24rem)] overflow-y-auto p-4"
            align="start"
          >
            <OrganisationTypeHelpContent highlightType={value} />
          </PopoverContent>
        </Popover>
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as OrganisationType)}>
        <SelectTrigger id="organisation-type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ORGANISATION_TYPE_HELP) as OrganisationType[]).map((type) => (
            <SelectItem key={type} value={type}>
              {ORGANISATION_TYPE_HELP[type].title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
