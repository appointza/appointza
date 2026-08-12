import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { OrganisationServices } from "@/models/organisationservices.model";
import { ServicePricingFields } from "@/components/organization/ServicePricingFields";
import { OrgImageAssetField } from "@/components/organization/OrgImageAssetField";
import {
  serviceFormInputClass,
  serviceFormLabelClass,
} from "@/components/organization/ServiceFormShell";

type ServiceEditorFieldsProps = {
  service: OrganisationServices;
  onChange: (service: OrganisationServices) => void;
  idPrefix?: string;
  serviceImages: number[];
  onServiceImagesChange: (imageIds: number[]) => void;
};

export function ServiceEditorFields({
  service,
  onChange,
  idPrefix = "",
  serviceImages,
  onServiceImagesChange,
}: ServiceEditorFieldsProps) {
  const prefix = idPrefix ? `${idPrefix}-` : "";

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`${prefix}name`} className={serviceFormLabelClass}>
          Service name *
        </Label>
        <Input
          id={`${prefix}name`}
          value={service.Servicename}
          onChange={(e) => onChange({ ...service, Servicename: e.target.value })}
          className={serviceFormInputClass}
          placeholder="Enter service name"
        />
      </div>

      {!service.Iscombo && (
        <ServicePricingFields
          service={service}
          idPrefix={idPrefix}
          onChange={(patch) => onChange({ ...service, ...patch })}
        />
      )}

      <div className="grid gap-2">
        <Label htmlFor={`${prefix}duration`} className={serviceFormLabelClass}>
          Duration (minutes) *
        </Label>
        <NumberInput
          id={`${prefix}duration`}
          min={1}
          value={service.timetaken}
          onValueChange={(timetaken) => onChange({ ...service, timetaken })}
          className={serviceFormInputClass}
          placeholder="Enter duration in minutes"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${prefix}notes`} className={serviceFormLabelClass}>
          Notes
        </Label>
        <Input
          id={`${prefix}notes`}
          value={service.notes || ""}
          onChange={(e) => onChange({ ...service, notes: e.target.value })}
          className={serviceFormInputClass}
          placeholder="Optional notes about this service"
        />
      </div>

      <OrgImageAssetField
        label="Service images"
        description="Upload or pick from organisation assets. New uploads are saved to Assets automatically."
        imageIds={serviceImages}
        onChange={onServiceImagesChange}
        idPrefix={`${prefix}service-images`}
      />

      <div className="flex items-center gap-2 rounded-2xl border border-stone-100 bg-appointza-cream/40 px-4 py-3">
        <Checkbox
          id={`${prefix}show-price`}
          checked={service.show_price ?? true}
          onCheckedChange={(checked) =>
            onChange({ ...service, show_price: checked === true })
          }
        />
        <Label
          htmlFor={`${prefix}show-price`}
          className="cursor-pointer text-sm font-normal text-stone-700"
        >
          Show price to customers
        </Label>
      </div>
    </>
  );
}

type ComboEditorFieldsProps = {
  service: OrganisationServices;
  onChange: (service: OrganisationServices) => void;
  services: OrganisationServices[];
  selectedComboServices: OrganisationServices[];
  onSelectedComboServicesChange: (services: OrganisationServices[]) => void;
};

export function ComboEditorFields({
  service,
  onChange,
  services,
  selectedComboServices,
  onSelectedComboServicesChange,
}: ComboEditorFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label>Select services for combo</Label>
        <div className="max-h-60 overflow-y-auto rounded-md border p-4">
          {services
            .filter((s) => !s.Iscombo)
            .map((serviceItem) => (
              <div key={serviceItem.id} className="flex items-center space-x-2 py-2">
                <Checkbox
                  id={`combo-${serviceItem.id}`}
                  checked={selectedComboServices.some((s) => s.id === serviceItem.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectedComboServicesChange([...selectedComboServices, serviceItem]);
                    } else {
                      onSelectedComboServicesChange(
                        selectedComboServices.filter((s) => s.id !== serviceItem.id),
                      );
                    }
                  }}
                />
                <Label htmlFor={`combo-${serviceItem.id}`} className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{serviceItem.Servicename}</span>
                    {serviceItem.show_price !== false && (
                      <span className="text-sm text-muted-foreground">
                        ₹{serviceItem.prize.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="combo-name">Combo name *</Label>
        <Input
          id="combo-name"
          value={service.Servicename}
          onChange={(e) => onChange({ ...service, Servicename: e.target.value })}
          placeholder="Enter combo name"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="combo-offer-price">Offer price (₹) *</Label>
        <NumberInput
          id="combo-offer-price"
          min={0}
          value={service.offerprize || 0}
          onValueChange={(offerprize) => onChange({ ...service, offerprize })}
          placeholder="Enter offer price in ₹"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="combo-duration">Total duration (minutes) *</Label>
        <NumberInput
          id="combo-duration"
          min={1}
          value={service.timetaken}
          onValueChange={(timetaken) => onChange({ ...service, timetaken })}
          placeholder="Enter total duration in minutes"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="combo-notes">Notes</Label>
        <Input
          id="combo-notes"
          value={service.notes || ""}
          onChange={(e) => onChange({ ...service, notes: e.target.value })}
          placeholder="Enter any additional notes about the combo"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="combo-show-price"
          checked={service.show_price ?? true}
          onCheckedChange={(checked) =>
            onChange({ ...service, show_price: checked === true })
          }
        />
        <Label htmlFor="combo-show-price" className="cursor-pointer text-sm font-normal">
          Show price to customers
        </Label>
      </div>
    </>
  );
}
