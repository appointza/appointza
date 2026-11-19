import { describe, expect, it } from "vitest";
import { mapStaffInviteLookup } from "@/utils/staffInviteLookup.util";
import { StaffInviteLookupRes } from "@/models/users.model";

describe("mapStaffInviteLookup", () => {
  it("hides invite UI when user belongs to another organisation", () => {
    const lookup = Object.assign(new StaffInviteLookupRes(), {
      exists: true,
      can_invite: false,
      belongs_to_other_organisation: true,
      userid: 99,
      display_name: "A*** K***",
      email: "secret@other.com",
      mobile: "9000000001",
      message: "linked to another organisation",
    });
    const ui = mapStaffInviteLookup(lookup, "9000000001");
    expect(ui.kind).toBe("blocked");
    if (ui.kind === "blocked") {
      expect(ui.message).toMatch(/organisation/i);
    }
  });

  it("allows invite when can_invite is true", () => {
    const lookup = Object.assign(new StaffInviteLookupRes(), {
      exists: true,
      can_invite: true,
      belongs_to_other_organisation: false,
      userid: 12,
      display_name: "Local User",
      email: "a@b.com",
      mobile: "9000000002",
      message: "User found",
    });
    const ui = mapStaffInviteLookup(lookup, "9000000002");
    expect(ui).toEqual({
      kind: "inviteable",
      userid: 12,
      name: "Local User",
      email: "a@b.com",
      mobile: "9000000002",
      message: "User found",
    });
  });

  it("treats missing account as not_found", () => {
    const ui = mapStaffInviteLookup(
      Object.assign(new StaffInviteLookupRes(), { exists: false }),
      "9000000003",
    );
    expect(ui.kind).toBe("not_found");
  });
});
