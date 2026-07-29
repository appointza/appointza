import type { PageBlock } from "./types";

const DEFAULT_PADDING = { top: 80, right: 40, bottom: 80, left: 40 };
const DEFAULT_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function asLayout(raw: Record<string, unknown>): PageBlock["layout"] {
  const layout = asRecord(raw.layout ?? raw.Layout);
  const padding = asRecord(layout.padding ?? layout.Padding);
  const margin = asRecord(layout.margin ?? layout.Margin);
  return {
    width: typeof layout.width === "number" ? layout.width : 100,
    height: layout.height === "auto" || typeof layout.height === "number" ? layout.height : "auto",
    padding: {
      top: typeof padding.top === "number" ? padding.top : DEFAULT_PADDING.top,
      right: typeof padding.right === "number" ? padding.right : DEFAULT_PADDING.right,
      bottom: typeof padding.bottom === "number" ? padding.bottom : DEFAULT_PADDING.bottom,
      left: typeof padding.left === "number" ? padding.left : DEFAULT_PADDING.left,
    },
    margin: {
      top: typeof margin.top === "number" ? margin.top : DEFAULT_MARGIN.top,
      right: typeof margin.right === "number" ? margin.right : DEFAULT_MARGIN.right,
      bottom: typeof margin.bottom === "number" ? margin.bottom : DEFAULT_MARGIN.bottom,
      left: typeof margin.left === "number" ? margin.left : DEFAULT_MARGIN.left,
    },
  };
}

/** Normalize API / JSON blocks (camelCase or PascalCase) into PageBlock. */
export function normalizePageBlock(raw: unknown): PageBlock {
  const r = asRecord(raw);
  const id = String(r.id ?? r.Id ?? crypto.randomUUID());
  const type = String(r.type ?? r.Type ?? "").trim();
  const props = asRecord(r.props ?? r.Props);

  return {
    id,
    type,
    props,
    layout: asLayout(r),
  };
}

export function normalizePageBlocks(blocks: unknown): PageBlock[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map(normalizePageBlock);
}
