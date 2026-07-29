const MANAGED_ORG_KEY = "appointzastay_managed_org";

export interface ManagedOrganisation {
  id: string;
  name: string;
}

export function getManagedOrganisation(): ManagedOrganisation | null {
  const raw = localStorage.getItem(MANAGED_ORG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ManagedOrganisation;
    if (parsed?.id && parsed?.name) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setManagedOrganisation(org: ManagedOrganisation): void {
  localStorage.setItem(MANAGED_ORG_KEY, JSON.stringify(org));
  window.dispatchEvent(new CustomEvent("appointzastay:managed-org-changed", { detail: org }));
}

export function clearManagedOrganisation(): void {
  localStorage.removeItem(MANAGED_ORG_KEY);
  window.dispatchEvent(new CustomEvent("appointzastay:managed-org-changed", { detail: null }));
}
