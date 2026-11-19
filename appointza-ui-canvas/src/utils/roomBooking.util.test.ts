import { describe, expect, it } from "vitest";
import type { OrganisationRoom } from "@/models/hospitality.model";
import { expandClientRoomStays } from "@/utils/roomBooking.util";

describe("expandClientRoomStays", () => {
  it("includes closed history stays matching phone", () => {
    const rooms = [
      {
        id: 10,
        room_number: "101",
        room_name: "Deluxe",
        status: "available",
        guest: null,
        payment: null,
        booking: {
          booking_id: "",
          check_in: "",
          check_out: "",
          nights: 0,
          stays: [
            {
              booking_id: "BK-261118-3709",
              booking_guid: "g1",
              check_in: "2026-11-18",
              check_out: "2026-11-19",
              nights: 1,
              closed: true,
              status: "checked_out",
              guest: { name: "Ada", phone: "9000000001" },
              payment: { total: 2000, paid: 2000, balance: 0 },
              package_ids: [],
            },
            {
              booking_id: "BK-OPEN",
              booking_guid: "g2",
              check_in: "2026-11-20",
              check_out: "2026-11-22",
              nights: 2,
              closed: false,
              status: "reserved",
              guest: { name: "Ada", phone: "9000000001" },
              payment: { total: 4000, paid: 0, balance: 4000 },
              package_ids: [],
            },
          ],
        },
      } as OrganisationRoom,
    ];

    const rows = expandClientRoomStays(rooms, { mobile: "9000000001" });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.booking?.booking_id).sort()).toEqual([
      "BK-261118-3709",
      "BK-OPEN",
    ]);
    expect(rows.find((r) => r.booking?.booking_id === "BK-261118-3709")?.payment?.total).toBe(2000);
  });
});
