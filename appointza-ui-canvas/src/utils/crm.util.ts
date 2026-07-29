export function resolveOrganisationId(organisationIdFromUser?: number): number {
  if (organisationIdFromUser && organisationIdFromUser > 0) {
    return organisationIdFromUser;
  }
  try {
    const ctx = JSON.parse(localStorage.getItem("user_context") || "{}");
    const id = Number(ctx.organisationid ?? 0);
    return Number.isFinite(id) && id > 0 ? id : 0;
  } catch {
    return 0;
  }
}

export function clientInitials(name: string | undefined): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}
