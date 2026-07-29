import { keysToCamelCase } from "@/models/organisationProfile";
import { hydrateBlocksFromOrganisation } from "./hydrateBlocksFromOrganisation";
import { hydrateBlocksWithRooms } from "./hydrateBlocksWithRooms";
import { normalizeSiteBuilderPayload } from "./normalizeSiteBuilderPayload";

export function normalizePropertyPayload(raw: unknown) {
  const data = keysToCamelCase(raw ?? {}) as Record<string, unknown>;
  const organisation = (data.organisation as Record<string, unknown>) ?? {};
  const rooms = Array.isArray(data.rooms) ? data.rooms : [];
  const { blocks, pageSettings, siteName, templateMode, renderedHtml } =
    normalizeSiteBuilderPayload(data);

  const withOrg = hydrateBlocksFromOrganisation(blocks, organisation);
  const withRooms = hydrateBlocksWithRooms(withOrg, rooms);

  return {
    organisation,
    rooms,
    blocks: withRooms,
    pageSettings,
    templateMode,
    renderedHtml,
    siteName: siteName || str(organisation, "name") || "Property",
  };
}

function str(org: Record<string, unknown>, key: string): string {
  const v = org[key];
  return v == null ? "" : String(v).trim();
}
