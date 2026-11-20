/** Canonical appointment status codes shared by backend and frontend. */
export const APPOINTMENT_STATUS_CODES = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentStatusCode = (typeof APPOINTMENT_STATUS_CODES)[number];

/** @deprecated Prefer AppointmentStatusCode — kept for existing dashboard bucket imports. */
export type AppointmentStatusBucket = AppointmentStatusCode;

const STATUS_LABELS: Record<AppointmentStatusCode, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

const STATUS_BADGE_CLASS: Record<AppointmentStatusCode, string> = {
  PENDING: "border-transparent bg-amber-50 text-amber-900",
  CONFIRMED: "border-transparent bg-sky-50 text-sky-800",
  IN_PROGRESS: "border-transparent bg-indigo-50 text-indigo-800",
  COMPLETED: "border-transparent bg-emerald-50 text-emerald-800",
  CANCELLED: "border-transparent bg-red-50 text-red-800",
  NO_SHOW: "border-transparent bg-zinc-100 text-zinc-700",
};

const STATUS_ORDER_INDEX: Record<string, number> = Object.fromEntries(
  APPOINTMENT_STATUS_CODES.map((code, index) => [code, index]),
);

/**
 * Normalize API statuscode for comparisons (trim + uppercase).
 * Empty / whitespace-only values become "".
 */
export function normalizeAppointmentStatusCode(
  statuscode: string | null | undefined,
): string {
  return String(statuscode ?? "").trim().toUpperCase();
}

function isCanonicalStatus(code: string): code is AppointmentStatusCode {
  return (APPOINTMENT_STATUS_CODES as readonly string[]).includes(code);
}

/**
 * Resolve a raw API status into a canonical enum value.
 * Blank → PENDING. Unknown values log a warning and return null.
 */
export function resolveAppointmentStatus(
  statuscode: string | null | undefined,
): AppointmentStatusCode | null {
  const code = normalizeAppointmentStatusCode(statuscode);
  if (!code) return "PENDING";
  if (isCanonicalStatus(code)) return code;
  // Common aliases
  if (code === "IN-PROGRESS" || code === "INPROGRESS" || code === "STARTED") {
    return "IN_PROGRESS";
  }
  if (code === "NOSHOW" || code === "NO-SHOW") return "NO_SHOW";
  if (code === "BOOKED" || code === "SCHEDULED" || code === "CONFIRM") {
    return code === "CONFIRM" ? "CONFIRMED" : "PENDING";
  }
  console.warn(`[appointmentStatus] Unrecognised statuscode: "${statuscode}"`);
  return null;
}

/**
 * Map a raw API status into a display bucket (unknown → PENDING for counts).
 */
export function toAppointmentStatusBucket(
  statuscode: string | null | undefined,
): AppointmentStatusCode {
  return resolveAppointmentStatus(statuscode) ?? "PENDING";
}

/** Human-readable label; never returns "Unknown" / "Scheduled" / "N/A". */
export function getAppointmentStatusLabel(
  statuscode: string | null | undefined,
): string {
  const resolved = resolveAppointmentStatus(statuscode);
  if (resolved) return STATUS_LABELS[resolved];
  const raw = normalizeAppointmentStatusCode(statuscode);
  return raw || STATUS_LABELS.PENDING;
}

export function getAppointmentStatusBadgeClass(
  statuscode: string | null | undefined,
): string {
  const resolved = resolveAppointmentStatus(statuscode) ?? "PENDING";
  return STATUS_BADGE_CLASS[resolved];
}

export type AppointmentStatusPresentation = {
  code: AppointmentStatusCode;
  label: string;
  className: string;
};

export function getAppointmentStatusPresentation(
  statuscode: string | null | undefined,
): AppointmentStatusPresentation {
  const code = toAppointmentStatusBucket(statuscode);
  return {
    code,
    label: STATUS_LABELS[code],
    className: STATUS_BADGE_CLASS[code],
  };
}

/** Logical dropdown order: Pending → Confirmed → In Progress → Completed → Cancelled (+ No Show). */
export function sortAppointmentStatusesByCanonicalOrder<
  T extends { identifier?: string | null },
>(values: T[]): T[] {
  return [...values].sort((a, b) => {
    const ka =
      STATUS_ORDER_INDEX[normalizeAppointmentStatusCode(a.identifier)] ?? 999;
    const kb =
      STATUS_ORDER_INDEX[normalizeAppointmentStatusCode(b.identifier)] ?? 999;
    if (ka !== kb) return ka - kb;
    return String(a.identifier ?? "").localeCompare(String(b.identifier ?? ""));
  });
}

export type AppointmentStatusCounts = {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  inProgress: number;
  noShow: number;
};

/**
 * Count appointments by status. `total` excludes cancelled (active bookings).
 */
export function countAppointmentsByStatus(
  appointments: Array<{ statuscode?: string | null }>,
): AppointmentStatusCounts {
  const counts: AppointmentStatusCounts = {
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    inProgress: 0,
    noShow: 0,
  };

  for (const appointment of appointments) {
    switch (toAppointmentStatusBucket(appointment.statuscode)) {
      case "CONFIRMED":
        counts.confirmed += 1;
        counts.total += 1;
        break;
      case "CANCELLED":
        counts.cancelled += 1;
        break;
      case "COMPLETED":
        counts.completed += 1;
        counts.total += 1;
        break;
      case "IN_PROGRESS":
        counts.inProgress += 1;
        counts.total += 1;
        break;
      case "NO_SHOW":
        counts.noShow += 1;
        counts.total += 1;
        break;
      case "PENDING":
      default:
        counts.pending += 1;
        counts.total += 1;
        break;
    }
  }

  return counts;
}

/** Upcoming list: future bookings that are Pending or Confirmed only. */
export function isUpcomingAppointmentStatus(
  statuscode: string | null | undefined,
): boolean {
  const bucket = toAppointmentStatusBucket(statuscode);
  return bucket === "CONFIRMED" || bucket === "PENDING";
}

export function isPastOrCancelledAppointmentStatus(
  statuscode: string | null | undefined,
): boolean {
  const bucket = toAppointmentStatusBucket(statuscode);
  return (
    bucket === "COMPLETED" ||
    bucket === "CANCELLED" ||
    bucket === "NO_SHOW"
  );
}
