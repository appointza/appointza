import type { TemplateBuilderPage, TemplateBuilderProject } from "@/types/templateBuilder.types";
import { createDefaultHomePage } from "./defaults";

const BUILDER_VERSION = 2 as const;

export function createDefaultProject(): TemplateBuilderProject {
  return {
    builderVersion: BUILDER_VERSION,
    pages: { home: createDefaultHomePage() },
  };
}

/** Parse builder JSON from referencevalues.notes; fall back to a fresh project. */
export function parseBuilderProject(notes: string | null | undefined): TemplateBuilderProject {
  if (!notes?.trim()) return createDefaultProject();
  try {
    const parsed = JSON.parse(notes) as Partial<TemplateBuilderProject>;
    if (parsed?.builderVersion === 2 && parsed.pages && typeof parsed.pages === "object") {
      return {
        builderVersion: BUILDER_VERSION,
        pages: parsed.pages as Record<string, TemplateBuilderPage>,
      };
    }
  } catch {
    /* legacy notes — not JSON */
  }
  return createDefaultProject();
}

export function serializeBuilderProject(project: TemplateBuilderProject): string {
  return JSON.stringify(project);
}
