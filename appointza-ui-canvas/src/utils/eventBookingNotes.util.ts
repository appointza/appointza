export type EventBookingNotesPayload = {
  attendees?: string[];
  form?: Record<string, any>;
};

export function encodeEventBookingNotes(attendees: string[], formValues: Record<string, any>) {
  const payload: EventBookingNotesPayload = {
    attendees: (attendees || []).filter((a) => String(a || "").trim().length > 0),
    form: formValues || {},
  };

  // Store as JSON for flexible schema (backward compatible; old bookings are plain text).
  return JSON.stringify(payload);
}

export function decodeEventBookingNotes(notes: string | null | undefined): {
  attendeesText: string;
  payload: EventBookingNotesPayload | null;
} {
  const raw = String(notes || "").trim();
  if (!raw) return { attendeesText: "", payload: null };

  // Try JSON first.
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try {
      const parsed = JSON.parse(raw) as EventBookingNotesPayload;
      const attendees = Array.isArray(parsed.attendees) ? parsed.attendees : [];
      return { attendeesText: attendees.join(", "), payload: parsed };
    } catch {
      // Fall through to legacy text.
    }
  }

  // Legacy format: comma-separated names in plain text.
  return { attendeesText: raw, payload: null };
}

