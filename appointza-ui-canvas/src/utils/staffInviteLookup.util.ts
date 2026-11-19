import type { StaffInviteLookupRes } from "@/models/users.model";

export type StaffInviteUiState =
  | { kind: "not_found"; message: string }
  | { kind: "blocked"; message: string }
  | {
      kind: "inviteable";
      userid: number;
      name: string;
      email: string;
      mobile: string;
      message: string;
    };

/** Map API lookup result to UI without ever trusting cross-org PII. */
export function mapStaffInviteLookup(
  lookup: StaffInviteLookupRes | null | undefined,
  fallbackMobile: string,
): StaffInviteUiState {
  if (!lookup?.exists) {
    return {
      kind: "not_found",
      message:
        lookup?.message ||
        `No Appointza user with ${fallbackMobile}. Ask them to register, then invite by phone.`,
    };
  }

  if (lookup.belongs_to_other_organisation || !lookup.can_invite) {
    return {
      kind: "blocked",
      message:
        lookup.message ||
        "This number is linked to another organisation. Name and email are not shared.",
    };
  }

  return {
    kind: "inviteable",
    userid: lookup.userid,
    name: lookup.display_name || "Appointza user",
    email: lookup.email || "",
    mobile: lookup.mobile || fallbackMobile,
    message: lookup.message || `Found ${lookup.display_name || "user"}`,
  };
}
