import type { OrgAssetCatalog, OrgTemplateAsset } from "@/types/orgAssets.types";
import type { TemplateBuilderProject } from "@/types/templateBuilder.types";

export function createEmptyAssetCatalog(): OrgAssetCatalog {
  return { version: 1, assets: [] };
}

export function parseOrgAssetCatalog(notes: string | null | undefined): OrgAssetCatalog {
  if (!notes?.trim()) return createEmptyAssetCatalog();
  try {
    const parsed = JSON.parse(notes) as Partial<OrgAssetCatalog>;
    if (parsed?.version === 1 && Array.isArray(parsed.assets)) {
      return {
        version: 1,
        assets: parsed.assets
          .map((a) => ({
            id: Number((a as OrgTemplateAsset).id),
            name: String((a as OrgTemplateAsset).name ?? ""),
            addedAt: String((a as OrgTemplateAsset).addedAt ?? ""),
          }))
          .filter((a) => a.id > 0),
      };
    }
  } catch {
    /* ignore */
  }
  return createEmptyAssetCatalog();
}

export function serializeOrgAssetCatalog(catalog: OrgAssetCatalog): string {
  return JSON.stringify(catalog);
}

export function mergeAssets(
  existing: OrgTemplateAsset[],
  incoming: OrgTemplateAsset[],
): OrgTemplateAsset[] {
  const map = new Map<number, OrgTemplateAsset>();
  for (const a of existing) {
    if (a.id > 0) map.set(a.id, a);
  }
  for (const a of incoming) {
    if (a.id > 0) map.set(a.id, a);
  }
  return [...map.values()].sort((a, b) => b.id - a.id);
}

/** Collect file ids referenced in template block data. */
export function collectImageIdsFromProject(project: TemplateBuilderProject): number[] {
  const ids = new Set<number>();
  for (const page of Object.values(project.pages)) {
    for (const block of page.blocks) {
      const d = block.data as Record<string, unknown>;
      const imageId = Number(d.imageId);
      if (Number.isFinite(imageId) && imageId > 0) ids.add(imageId);
      if (Array.isArray(d.imageIds)) {
        for (const raw of d.imageIds) {
          const id = Number(raw);
          if (Number.isFinite(id) && id > 0) ids.add(id);
        }
      }
      if (Array.isArray(d.members)) {
        for (const raw of d.members) {
          const id = Number((raw as { imageId?: number }).imageId);
          if (Number.isFinite(id) && id > 0) ids.add(id);
        }
      }
      const bgId = Number(d.backgroundImageId);
      if (Number.isFinite(bgId) && bgId > 0) ids.add(bgId);
    }
  }
  return [...ids];
}
