/** Mirrors Webzys `types/builder.ts` — one block on the booking-page canvas. */
export interface TemplateBuilderBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
  visible: boolean;
}

export interface TemplateBuilderPage {
  id: string;
  name: string;
  blocks: TemplateBuilderBlock[];
}

/** Stored in referencevalues.notes as JSON for re-editing. */
export interface TemplateBuilderProject {
  builderVersion: 2;
  pages: Record<string, TemplateBuilderPage>;
}

export interface TemplateBuilderBlockType {
  type: string;
  name: string;
  description: string;
  /** appointza = live data placeholders; static = editable copy in block.data */
  mode: "appointza" | "static";
}

export interface TemplateBuilderCategory {
  name: string;
  blocks: TemplateBuilderBlockType[];
}
