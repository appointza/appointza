import { ReferenceTypeSelectReq } from "@/models/referencetype.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import type { ReferenceTypeService } from "@/services/referencetype.service";
import type { ReferenceValueService } from "@/services/referencevalue.service";
import { REFERENCETYPE } from "@/models/users.model";
import {
  mergeReferenceValueAttributes,
  nextReferenceValueDisplayOrder,
  sortReferenceValuesByDisplayOrder,
} from "@/utils/referencevalue.util";

export type CreateAppointmentTaskValueInput = {
  identifier: string;
  displaytext: string;
  description?: string;
  datatype: string;
  notes?: string;
};

export function slugifyAppointmentValueIdentifier(label: string): string {
  const base = label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || "FIELD";
}

export function parseDataTypeFromNotes(notes: string): { datatype: string; description: string } {
  if (!notes) return { datatype: "string", description: "" };

  const lines = notes.split("\n");
  const dataTypeLine = lines.find((line) => line.startsWith("Data Type:"));

  if (dataTypeLine) {
    const datatype = dataTypeLine.replace("Data Type:", "").trim();
    const description =
      lines.find((line) => line.startsWith("Notes:"))?.replace("Notes:", "").trim() ||
      lines
        .filter((line) => !line.startsWith("Data Type:") && !line.startsWith("Notes:"))
        .join("\n")
        .trim();
    return { datatype, description };
  }

  return { datatype: "string", description: notes };
}

export async function resolveAppointmentTaskReferenceTypeId(
  referenceTypeService: ReferenceTypeService,
  organizationId: number,
): Promise<number> {
  const req = new ReferenceTypeSelectReq();
  req.identifier = "APPOINTMENTTASK";
  const types = (await referenceTypeService.select(req)) || [];
  const orgMatch = types.find((t) => Number(t.organizationid) === organizationId);
  if (orgMatch?.id) return Number(orgMatch.id);
  const globalMatch = types.find((t) => !t.organizationid || Number(t.organizationid) === 0);
  if (globalMatch?.id) return Number(globalMatch.id);
  return REFERENCETYPE.APPOINTMENTTASK;
}

export async function loadAppointmentTaskValues(
  referenceTypeService: ReferenceTypeService,
  referenceValueService: ReferenceValueService,
  organizationId: number,
): Promise<ReferenceValue[]> {
  if (organizationId <= 0) return [];

  const referencetypeid = await resolveAppointmentTaskReferenceTypeId(
    referenceTypeService,
    organizationId,
  );

  const valueReq = new ReferenceValueSelectReq();
  valueReq.referencetypeid = referencetypeid;
  valueReq.organisationid = organizationId;
  const values = await referenceValueService.select(valueReq);
  return sortReferenceValuesByDisplayOrder(values || []);
}

export async function createAppointmentTaskValue(
  referenceTypeService: ReferenceTypeService,
  referenceValueService: ReferenceValueService,
  organizationId: number,
  existingTasks: ReferenceValue[],
  input: CreateAppointmentTaskValueInput,
): Promise<ReferenceValue> {
  if (organizationId <= 0) {
    throw new Error("Organization is required");
  }

  const referencetypeid = await resolveAppointmentTaskReferenceTypeId(
    referenceTypeService,
    organizationId,
  );

  const referenceValue = new ReferenceValue();
  referenceValue.identifier = input.identifier.trim();
  referenceValue.displaytext = input.displaytext.trim();
  referenceValue.description = input.description?.trim() || "";
  referenceValue.notes = `Data Type: ${input.datatype}${
    input.notes?.trim() ? `\n\nNotes: ${input.notes.trim()}` : ""
  }`;
  referenceValue.referencetypeid = referencetypeid;
  referenceValue.organizationid = organizationId;
  referenceValue.isactive = true;
  referenceValue.attributes = mergeReferenceValueAttributes(referenceValue, {
    DisplayOrder: nextReferenceValueDisplayOrder(existingTasks),
  });

  return referenceValueService.insert(referenceValue);
}
