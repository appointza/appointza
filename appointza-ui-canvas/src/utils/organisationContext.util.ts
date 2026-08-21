/** Resolve the active organisation from auth state, with persisted context fallback. */
export function resolveOrganisationId(organisationIdFromUser?: number): number {
  if (organisationIdFromUser && organisationIdFromUser > 0) {
    return organisationIdFromUser;
  }
  try {
    const context = JSON.parse(localStorage.getItem("user_context") || "{}");
    const organisationId = Number(context.organisationid ?? 0);
    return Number.isFinite(organisationId) && organisationId > 0 ? organisationId : 0;
  } catch {
    return 0;
  }
}
