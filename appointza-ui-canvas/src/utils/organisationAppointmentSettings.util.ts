export type OrganisationAppointmentSettings = {
  counter: number;
  openbefore: number;
  hasCounter: boolean;
  hasOpenbefore: boolean;
};

const DEFAULT_COUNTER = 1;

function parseAttributesObject(attributesJson?: string | null): Record<string, unknown> {
  if (!attributesJson?.trim()) return {};
  try {
    const parsed = JSON.parse(attributesJson) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

function readNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? null : Math.max(0, n);
  }
  return null;
}

export function parseOrganisationAppointmentSettings(
  attributesJson?: string | null,
): OrganisationAppointmentSettings {
  const base = parseAttributesObject(attributesJson);
  const counter = readNonNegativeInt(base.appointment_counter);
  const openbefore = readNonNegativeInt(base.appointment_openbefore);
  return {
    hasCounter: counter != null && counter > 0,
    hasOpenbefore: Object.prototype.hasOwnProperty.call(base, "appointment_openbefore"),
    counter: counter && counter > 0 ? counter : DEFAULT_COUNTER,
    openbefore: openbefore ?? 0,
  };
}

export function mergeOrganisationAppointmentSettings(
  attributesJson: string | undefined,
  settings: { counter: number; openbefore: number },
): string {
  const base = parseAttributesObject(attributesJson);
  base.appointment_counter = Math.max(1, Math.floor(settings.counter) || DEFAULT_COUNTER);
  base.appointment_openbefore = Math.max(0, Math.floor(settings.openbefore) || 0);
  return JSON.stringify(base);
}
