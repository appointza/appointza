import type { TemplateBuilderBlock, TemplateBuilderPage } from "@/types/templateBuilder.types";
import { createBlock, createDefaultHomePage, getDefaultBlockData } from "./defaults";

export type AiSiteChip =
  | "rooms"
  | "gallery"
  | "colours"
  | "maps"
  | "packages"
  | "events";

const CHIP_BLOCKS: Record<AiSiteChip, string[]> = {
  rooms: ["appointza-rooms", "appointza-hospitality-packages", "appointza-hospitality-policies"],
  gallery: ["appointza-location-images", "gallery"],
  colours: [],
  maps: ["appointza-location"],
  packages: ["appointza-hospitality-packages"],
  events: ["appointza-events"],
};

function ensureBlock(blocks: TemplateBuilderBlock[], type: string, seed: number) {
  if (blocks.some((b) => b.type === type)) return;
  blocks.push({
    id: `${type}-${seed}`,
    type,
    data: { ...getDefaultBlockData(type) },
    visible: true,
  });
}

/** Build a live-data block page from a free-text description + optional starter chips. */
export function generateSitePageFromDescription(
  description: string,
  chips: AiSiteChip[] = [],
  options?: { organisationName?: string; theme?: string },
): TemplateBuilderPage {
  const page = createDefaultHomePage();
  const blocks = [...page.blocks];
  const text = `${description} ${chips.join(" ")} ${options?.theme || ""}`.toLowerCase();
  const seed = Date.now();

  if (/room|resort|hotel|stay|hospitality|lodge/.test(text) || chips.includes("rooms")) {
    for (const type of CHIP_BLOCKS.rooms) ensureBlock(blocks, type, seed + type.length);
  }
  if (/galler|photo|portfolio|image/.test(text) || chips.includes("gallery")) {
    for (const type of CHIP_BLOCKS.gallery) ensureBlock(blocks, type, seed + type.length + 11);
  }
  if (/map|location|direction|google/.test(text) || chips.includes("maps")) {
    for (const type of CHIP_BLOCKS.maps) ensureBlock(blocks, type, seed + type.length + 21);
  }
  if (/package|offer|combo/.test(text) || chips.includes("packages")) {
    for (const type of CHIP_BLOCKS.packages) ensureBlock(blocks, type, seed + type.length + 31);
  }
  if (/event|tournament|workshop|class/.test(text) || chips.includes("events")) {
    for (const type of CHIP_BLOCKS.events) ensureBlock(blocks, type, seed + type.length + 41);
  }

  const about = blocks.find((b) => b.type === "about");
  if (about && description.trim()) {
    about.data = {
      ...about.data,
      content: description.trim(),
      title: options?.organisationName ? `About ${options.organisationName}` : "About us",
    };
  }

  const hero = blocks.find((b) => b.type.startsWith("hero"));
  if (hero && options?.theme?.trim()) {
    hero.data = {
      ...hero.data,
      subtitle: options.theme.trim(),
    };
  }

  // Prefer live Appointza blocks — drop duplicate static gallery if live images exist.
  const hasLiveGallery = blocks.some((b) => b.type === "appointza-location-images");
  const filtered = hasLiveGallery ? blocks.filter((b) => b.type !== "gallery") : blocks;

  return {
    ...page,
    name: options?.organisationName ? `${options.organisationName} site` : page.name,
    blocks: filtered,
  };
}

export function applyChipToPage(page: TemplateBuilderPage, chip: AiSiteChip): TemplateBuilderPage {
  if (chip === "colours") {
    return {
      ...page,
      blocks: page.blocks.map((block) =>
        block.type.startsWith("hero")
          ? {
              ...block,
              data: {
                ...block.data,
                variant: Number(block.data?.variant || 1) === 1 ? 2 : 1,
              },
            }
          : block,
      ),
    };
  }
  const next = [...page.blocks];
  const seed = Date.now();
  for (const type of CHIP_BLOCKS[chip] || []) {
    ensureBlock(next, type, seed + type.length);
  }
  if (chip === "gallery") {
    ensureBlock(next, "appointza-location-images", seed + 99);
  }
  return { ...page, blocks: next };
}

export function clonePageSnapshot(page: TemplateBuilderPage): TemplateBuilderPage {
  return JSON.parse(JSON.stringify(page)) as TemplateBuilderPage;
}

export const AI_SITE_CHIPS: Array<{ id: AiSiteChip; label: string }> = [
  { id: "rooms", label: "Add rooms section" },
  { id: "gallery", label: "Add gallery" },
  { id: "colours", label: "Change colours" },
  { id: "maps", label: "Add Google Maps" },
  { id: "packages", label: "Add packages" },
  { id: "events", label: "Add events" },
];

export { createBlock };
