import { useCallback, useMemo, useState } from "react";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { ReferenceType, ReferenceTypeSelectReq } from "@/models/referencetype.model";
import {
  mergeReferenceValueAttributes,
  nextReferenceValueDisplayOrder,
  sortReferenceValuesByDisplayOrder,
} from "@/utils/referencevalue.util";
import {
  type EventBookingFormField,
  parseEventBookingFormFieldsFromNotes,
  serializeEventBookingFormFields,
} from "@/utils/eventBookingFormFields.util";

export type EventBookingFormLoadResult = {
  fields: EventBookingFormField[];
  existing: ReferenceValue | null;
  typeId: number;
};

export function useEventBookingForm(organizationId: number) {
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const ensureEventBookingFormTypeId = useCallback(async (): Promise<number> => {
    const req = new ReferenceTypeSelectReq();
    const allTypes = (await referenceTypeService.select(req)) || [];
    let type = allTypes.find((t) => t.identifier === "EVENTBOOKINGFORM");

    if (!type && organizationId) {
      const created = new ReferenceType();
      created.identifier = "EVENTBOOKINGFORM";
      created.displaytext = "Event Booking Form";
      created.langcode = "en";
      created.organizationid = organizationId;
      created.isactive = true;
      await referenceTypeService.insert(created);
      const refreshed = (await referenceTypeService.select(req)) || [];
      type = refreshed.find((t) => t.identifier === "EVENTBOOKINGFORM");
    }

    return type?.id ?? 0;
  }, [organizationId, referenceTypeService]);

  const loadFormForEvent = useCallback(
    async (eventId: number): Promise<EventBookingFormLoadResult> => {
      setIsLoading(true);
      try {
        const typeId = await ensureEventBookingFormTypeId();
        if (!typeId || !organizationId || !eventId) {
          return { fields: [], existing: null, typeId: 0 };
        }

        const req = new ReferenceValueSelectReq();
        req.referencetypeid = typeId;
        req.organisationid = organizationId;
        const values = sortReferenceValuesByDisplayOrder(
          (await referenceValueService.select(req)) || [],
        );
        const ident = `EVENT_${eventId}`;
        const existing =
          values.find((v) => (v.identifier || "").toUpperCase() === ident.toUpperCase()) ?? null;
        const fields = existing
          ? parseEventBookingFormFieldsFromNotes(existing.notes || "")
          : [];

        return { fields, existing, typeId };
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, ensureEventBookingFormTypeId, referenceValueService],
  );

  const saveFormForEvent = useCallback(
    async (
      eventId: number,
      eventName: string,
      fields: EventBookingFormField[],
      existing: ReferenceValue | null,
      typeId?: number,
    ): Promise<ReferenceValue> => {
      if (!organizationId || !eventId) {
        throw new Error("Missing organization or event");
      }

      setIsSaving(true);
      try {
        const referencetypeid = typeId ?? (await ensureEventBookingFormTypeId());
        if (!referencetypeid) {
          throw new Error("Event booking form type not found");
        }

        const notes = fields.length > 0 ? serializeEventBookingFormFields(fields) : "";
        const displayName = eventName.trim() || `Event ${eventId}`;

        if (existing) {
          const updated = { ...existing };
          updated.notes = notes;
          updated.displaytext = displayName;
          await referenceValueService.update(updated);
          return updated;
        }

        const req = new ReferenceValueSelectReq();
        req.referencetypeid = referencetypeid;
        req.organisationid = organizationId;
        const allValues = sortReferenceValuesByDisplayOrder(
          (await referenceValueService.select(req)) || [],
        );

        const referenceValue = new ReferenceValue();
        referenceValue.identifier = `EVENT_${eventId}`;
        referenceValue.displaytext = displayName;
        referenceValue.referencetypeid = referencetypeid;
        referenceValue.organizationid = organizationId;
        referenceValue.notes = notes;
        referenceValue.isactive = true;
        referenceValue.attributes = mergeReferenceValueAttributes(referenceValue, {
          DisplayOrder: nextReferenceValueDisplayOrder(allValues),
        });
        await referenceValueService.insert(referenceValue);
        return referenceValue;
      } finally {
        setIsSaving(false);
      }
    },
    [organizationId, ensureEventBookingFormTypeId, referenceValueService],
  );

  return { loadFormForEvent, saveFormForEvent, isLoading, isSaving };
}
