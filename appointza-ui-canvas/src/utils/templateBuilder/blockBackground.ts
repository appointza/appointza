import { blockFileUrl } from "./imageRefs";

export const BLOCK_BACKGROUND_DEFAULTS = {
  backgroundColor: "",
  backgroundImageId: 0,
  backgroundImage: "",
  backgroundOverlay: false,
  backgroundOverlayOpacity: 0.45,
};

export type BlockBackgroundData = typeof BLOCK_BACKGROUND_DEFAULTS;

export function hasBlockBackground(data: Record<string, unknown>): boolean {
  const bgImageId = Number(data.backgroundImageId);
  const bgImage = String(data.backgroundImage ?? "").trim();
  const bgColor = String(data.backgroundColor ?? "").trim();
  return (Number.isFinite(bgImageId) && bgImageId > 0) || !!bgImage || !!bgColor;
}

export function injectBlockBackground(html: string, data: Record<string, unknown>): string {
  if (!html.trim() || !hasBlockBackground(data)) return html;

  const bgImageId = Number(data.backgroundImageId);
  const bgImageUrl = String(data.backgroundImage ?? "").trim();
  const bgColor = String(data.backgroundColor ?? "").trim();
  const hasImage = (Number.isFinite(bgImageId) && bgImageId > 0) || !!bgImageUrl;

  const styleParts: string[] = ["position:relative"];
  if (hasImage) {
    const url =
      Number.isFinite(bgImageId) && bgImageId > 0 ? blockFileUrl(bgImageId) : bgImageUrl.replace(/'/g, "%27");
    styleParts.push(
      `background-image:url('${url}')`,
      "background-size:cover",
      "background-position:center",
      "background-repeat:no-repeat",
    );
  }
  if (bgColor) {
    styleParts.push(`background-color:${bgColor}`);
  }

  const overlayOpacity =
    typeof data.backgroundOverlayOpacity === "number" ? data.backgroundOverlayOpacity : 0.45;
  const overlay =
    data.backgroundOverlay && hasImage
      ? `<div class="az-block-bg-overlay" style="opacity:${overlayOpacity}"></div>`
      : "";

  const styleStr = styleParts.join(";");
  const extraClass = " az-has-block-bg";

  return html.replace(/<(section|header|footer)(\s[^>]*)?>/i, (_full, tag: string, attrs = "") => {
    let next = attrs;
    if (!/\bclass=/.test(next)) {
      next += ` class="${extraClass.trim()}"`;
    } else {
      next = next.replace(/\bclass=(["'])(.*?)\1/, (_m, q: string, cls: string) =>
        cls.includes("az-has-block-bg") ? `class=${q}${cls}${q}` : `class=${q}${cls}${extraClass}${q}`,
      );
    }
    if (/\bstyle=/.test(next)) {
      next = next.replace(/\bstyle=(["'])(.*?)\1/, (_m, q: string, s: string) =>
        s.includes("background-") ? `style=${q}${s}${q}` : `style=${q}${s};${styleStr}${q}`,
      );
    } else {
      next += ` style="${styleStr}"`;
    }
    return `<${tag}${next}>${overlay}`;
  });
}

export function collectBackgroundImageIds(data: Record<string, unknown>): number[] {
  const id = Number(data.backgroundImageId);
  return Number.isFinite(id) && id > 0 ? [id] : [];
}
