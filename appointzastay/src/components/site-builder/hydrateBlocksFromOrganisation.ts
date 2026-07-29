import type { PageBlock } from "./types";

function str(org: Record<string, unknown>, key: string): string {
  const v = org[key];
  return v == null ? "" : String(v).trim();
}

function wantsLiveProfile(props: Record<string, unknown>): boolean {
  const v = props.useLiveProfile;
  return v === true || v === "true";
}

/** Merge organisation profile into blocks marked useLiveProfile (public preview safety net). */
export function hydrateBlocksFromOrganisation(
  blocks: PageBlock[],
  org: Record<string, unknown>,
): PageBlock[] {
  const name = str(org, "name");
  const tagline = str(org, "tagline");
  const description = str(org, "description");

  if (!name && !tagline && !description) return blocks;

  return blocks.map((block) => {
    const props = block.props ?? {};
    if (!wantsLiveProfile(props)) return block;

    const next = { ...props };

    switch (block.type) {
      case "navigation":
      case "footer":
        if (name) next.logo = name;
        if (tagline) next.tagline = tagline;
        break;
      case "hotel-hero-banner":
        if (name) {
          next.hotelName = name;
          next.title = name;
        }
        if (tagline) {
          next.tagline = tagline;
          next.subtitle = tagline;
        }
        break;
      case "hotel-about":
        if (name) next.title = `About ${name}`;
        if (description) next.description = description;
        break;
      case "stats": {
        const weather = (org.weather && typeof org.weather === "object"
          ? (org.weather as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        const show =
          weather.showOnSite === true ||
          weather.showOnSite === "true" ||
          weather.ShowOnSite === true;
        next.hidden = !show;
        next.liveFromLocation = show;
        next.latitude = org.latitude ?? org.Latitude;
        next.longitude = org.longitude ?? org.Longitude;
        const loc = [str(org, "city"), str(org, "state"), str(org, "country")].filter(Boolean).join(", ");
        if (loc) next.locationLabel = loc;
        if (!next.title) next.title = "Weather";
        break;
      }
      default:
        break;
    }

    return { ...block, props: next };
  });
}
