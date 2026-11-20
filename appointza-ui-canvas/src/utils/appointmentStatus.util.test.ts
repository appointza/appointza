import { describe, expect, it, vi } from "vitest";
import {
  APPOINTMENT_STATUS_CODES,
  countAppointmentsByStatus,
  getAppointmentStatusLabel,
  getAppointmentStatusPresentation,
  isUpcomingAppointmentStatus,
  normalizeAppointmentStatusCode,
  resolveAppointmentStatus,
  sortAppointmentStatusesByCanonicalOrder,
  toAppointmentStatusBucket,
} from "@/utils/appointmentStatus.util";

describe("normalizeAppointmentStatusCode", () => {
  it("trims and uppercases status codes", () => {
    expect(normalizeAppointmentStatusCode("  confirmed ")).toBe("CONFIRMED");
    expect(normalizeAppointmentStatusCode("Pending")).toBe("PENDING");
    expect(normalizeAppointmentStatusCode("cancelled")).toBe("CANCELLED");
    expect(normalizeAppointmentStatusCode("COMPLETED")).toBe("COMPLETED");
    expect(normalizeAppointmentStatusCode("in_progress")).toBe("IN_PROGRESS");
  });

  it("treats nullish / blank as empty", () => {
    expect(normalizeAppointmentStatusCode(null)).toBe("");
    expect(normalizeAppointmentStatusCode(undefined)).toBe("");
    expect(normalizeAppointmentStatusCode("   ")).toBe("");
  });
});

describe("canonical status mapping", () => {
  it("every enum value has a label and presentation (case-insensitive)", () => {
    for (const code of APPOINTMENT_STATUS_CODES) {
      const lower = code.toLowerCase();
      const mixed = code[0] + code.slice(1).toLowerCase();
      expect(getAppointmentStatusLabel(lower)).toBeTruthy();
      expect(getAppointmentStatusLabel(mixed)).toBe(getAppointmentStatusLabel(code));
      expect(getAppointmentStatusPresentation(lower).code).toBe(code);
      expect(getAppointmentStatusPresentation(lower).label).toBe(
        getAppointmentStatusLabel(code),
      );
      expect(getAppointmentStatusPresentation(lower).className).toBeTruthy();
    }
  });

  it("does not depend on case for known statuses", () => {
    expect(toAppointmentStatusBucket("confirmed")).toBe("CONFIRMED");
    expect(toAppointmentStatusBucket(" CANCELLED ")).toBe("CANCELLED");
    expect(toAppointmentStatusBucket("Completed")).toBe("COMPLETED");
    expect(toAppointmentStatusBucket("pending")).toBe("PENDING");
    expect(toAppointmentStatusBucket("In_Progress")).toBe("IN_PROGRESS");
    expect(toAppointmentStatusBucket("no_show")).toBe("NO_SHOW");
  });

  it("maps blank to PENDING and warns on unrecognised values", () => {
    expect(toAppointmentStatusBucket("")).toBe("PENDING");
    expect(toAppointmentStatusBucket(null)).toBe("PENDING");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveAppointmentStatus("BOOKED_XYZ")).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    expect(toAppointmentStatusBucket("BOOKED")).toBe("PENDING");
  });

  it("never surfaces Unknown / Scheduled / N/A labels", () => {
    for (const code of APPOINTMENT_STATUS_CODES) {
      const label = getAppointmentStatusLabel(code);
      expect(label.toLowerCase()).not.toBe("unknown");
      expect(label.toLowerCase()).not.toBe("scheduled");
      expect(label.toLowerCase()).not.toBe("n/a");
    }
    expect(getAppointmentStatusLabel("")).toBe("Pending");
  });
});

describe("sortAppointmentStatusesByCanonicalOrder", () => {
  it("orders Pending, Confirmed, In Progress, Completed, Cancelled", () => {
    const sorted = sortAppointmentStatusesByCanonicalOrder([
      { identifier: "CANCELLED" },
      { identifier: "completed" },
      { identifier: "PENDING" },
      { identifier: "IN_PROGRESS" },
      { identifier: "Confirmed" },
    ]);
    expect(sorted.map((s) => normalizeAppointmentStatusCode(s.identifier))).toEqual([
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ]);
  });
});

describe("countAppointmentsByStatus", () => {
  it("counts mixed-case statuses and excludes cancelled from total", () => {
    const counts = countAppointmentsByStatus([
      { statuscode: "confirmed" },
      { statuscode: " PENDING" },
      { statuscode: "Cancelled" },
      { statuscode: "completed" },
      { statuscode: "confirmed" },
    ]);
    expect(counts).toEqual({
      total: 4,
      confirmed: 2,
      pending: 1,
      cancelled: 1,
      completed: 1,
      inProgress: 0,
      noShow: 0,
    });
  });

  it("counts blank statuses as pending without changing active total", () => {
    const counts = countAppointmentsByStatus([
      { statuscode: "" },
      { statuscode: null },
      { statuscode: "confirmed" },
    ]);
    expect(counts.total).toBe(3);
    expect(counts.confirmed).toBe(1);
    expect(counts.pending).toBe(2);
    expect(counts.cancelled + counts.completed).toBe(0);
  });
});

describe("isUpcomingAppointmentStatus", () => {
  it("accepts confirmed and pending only", () => {
    expect(isUpcomingAppointmentStatus("Confirmed")).toBe(true);
    expect(isUpcomingAppointmentStatus("pending")).toBe(true);
    expect(isUpcomingAppointmentStatus("")).toBe(true);
    expect(isUpcomingAppointmentStatus("CANCELLED")).toBe(false);
    expect(isUpcomingAppointmentStatus("COMPLETED")).toBe(false);
    expect(isUpcomingAppointmentStatus("IN_PROGRESS")).toBe(false);
  });
});
