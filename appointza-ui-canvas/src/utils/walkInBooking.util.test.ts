import { describe, expect, it } from "vitest";
import {
  buildWalkInBookingUrl,
  canRescheduleAppointmentStatus,
  parseWalkInSlotParams,
} from "@/utils/walkInBooking.util";

describe("parseWalkInSlotParams", () => {
  it("reads date and from from search params", () => {
    const params = new URLSearchParams("date=2026-11-20&from=10:00:00");
    expect(parseWalkInSlotParams(params)).toEqual({
      date: "2026-11-20",
      from: "10:00:00",
      to: "",
      hasPrefill: true,
    });
  });

  it("marks hasPrefill false when date missing", () => {
    expect(parseWalkInSlotParams(new URLSearchParams("from=10:00")).hasPrefill).toBe(false);
  });
});

describe("buildWalkInBookingUrl", () => {
  it("includes slot and customer query params", () => {
    expect(
      buildWalkInBookingUrl({
        organisationId: 16,
        organisationLocationId: 42,
        userId: 9,
        userMobile: "9000000001",
        date: "2026-11-20",
        from: "10:00",
        serviceId: 7,
      }),
    ).toBe(
      "/book-appointment/16/42?userId=9&userMobile=9000000001&date=2026-11-20&from=10%3A00&serviceId=7",
    );
  });
});

describe("canRescheduleAppointmentStatus", () => {
  it("allows pending/confirmed and blocks completed/cancelled", () => {
    expect(canRescheduleAppointmentStatus("PENDING")).toBe(true);
    expect(canRescheduleAppointmentStatus("CONFIRMED")).toBe(true);
    expect(canRescheduleAppointmentStatus("COMPLETED")).toBe(false);
    expect(canRescheduleAppointmentStatus("CANCELLED")).toBe(false);
  });
});
