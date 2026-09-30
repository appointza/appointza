import { useMemo } from "react";
import { useOrganisation } from "@/hooks/useOrganisation";
import {
  resolveInitialCatalogOfferings,
  type CatalogOfferingKind,
} from "@/utils/organisationCatalogOfferings.util";

export function useOrganisationCatalogOfferings(organisationId: number) {
  const { data: organisation, isLoading, isFetching } = useOrganisation({
    organisationId,
    enabled: organisationId > 0,
  });

  const offerings = useMemo(
    (): CatalogOfferingKind[] =>
      resolveInitialCatalogOfferings(
        organisation?.attributes_json,
        organisation?.organisation_type,
      ),
    [organisation?.attributes_json, organisation?.organisation_type],
  );

  return {
    offerings,
    offersServices: offerings.includes("services"),
    offersEvents: offerings.includes("events"),
    offersRooms: offerings.includes("rooms"),
    isLoading: organisationId > 0 && (isLoading || isFetching),
  };
}
