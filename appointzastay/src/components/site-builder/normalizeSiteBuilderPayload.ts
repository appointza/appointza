import type { SitePageSettings } from "./types";
import { normalizePageBlocks } from "./normalizePageBlock";
import type { PageBlock } from "./types";

function pick<T>(raw: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key] as T;
  }
  return undefined;
}

export function normalizePageSettings(raw: unknown): SitePageSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    backgroundColor: String(pick(r, "backgroundColor", "BackgroundColor") ?? "#faf8f5"),
    backgroundImage: String(pick(r, "backgroundImage", "BackgroundImage") ?? ""),
    textColor: String(pick(r, "textColor", "TextColor") ?? "#1a1a1a"),
  };
}

export function normalizeSiteBuilderPayload(data: Record<string, unknown> | undefined) {
  const raw = data ?? {};
  const blocks = normalizePageBlocks(pick(raw, "blocks", "Blocks"));
  const pageSettings = normalizePageSettings(
    pick(raw, "pageSettings", "PageSettings", "settings", "Settings"),
  );
  const siteName = String(pick(raw, "siteName", "SiteName") ?? "Your property");
  const templateMode =
    String(pick(raw, "templateMode", "TemplateMode") ?? "html").toLowerCase() === "blocks"
      ? "blocks"
      : "html";
  const customHtml = String(pick(raw, "customHtml", "CustomHtml") ?? "");
  const renderedHtml = String(pick(raw, "renderedHtml", "RenderedHtml") ?? "");
  return { blocks, pageSettings, siteName, templateMode, customHtml, renderedHtml } satisfies {
    blocks: PageBlock[];
    pageSettings: SitePageSettings;
    siteName: string;
    templateMode: "blocks" | "html";
    customHtml: string;
    renderedHtml: string;
  };
}
