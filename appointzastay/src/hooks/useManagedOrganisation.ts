import { useEffect, useState } from "react";
import {
  clearManagedOrganisation,
  getManagedOrganisation,
  setManagedOrganisation,
  type ManagedOrganisation,
} from "@/utils/platformAdminContext";

export function useManagedOrganisation() {
  const [managedOrg, setManagedOrg] = useState<ManagedOrganisation | null>(() => getManagedOrganisation());

  useEffect(() => {
    const sync = () => setManagedOrg(getManagedOrganisation());
    window.addEventListener("appointzastay:managed-org-changed", sync);
    return () => window.removeEventListener("appointzastay:managed-org-changed", sync);
  }, []);

  return {
    managedOrg,
    setManagedOrganisation: (org: ManagedOrganisation) => {
      setManagedOrganisation(org);
      setManagedOrg(org);
    },
    clearManagedOrganisation: () => {
      clearManagedOrganisation();
      setManagedOrg(null);
    },
  };
}
