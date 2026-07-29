import type { ProfileSectionId } from "@/models/stay";
import { PROFILE_SECTION_DEFS } from "@/config/profileSections";

export type OnboardingStepType = "profile" | "rooms" | "site-builder";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  actionLabel?: string;
  sectionId?: string;
  href?: string;
  group: string;
  required: boolean;
  stepType: OnboardingStepType;
}

export interface OnboardingPayload {
  percent: number;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  currentStepId?: string;
  steps: OnboardingStep[];
}

const PROFILE_SECTION_IDS = new Set(PROFILE_SECTION_DEFS.map((s) => s.id));

/** Steps that can be skipped during first-time setup (mirrors backend OptionalProfileSections). */
const OPTIONAL_STEP_IDS = new Set([
  "seo",
  "messaging",
  "payments",
  "weather",
  "schedule",
  "highlights",
  "amenities",
  "packages",
  "guest-services",
  "offers",
  "images",
  "nearby",
  "activities",
  "reviews",
  "food",
  "travel",
  "faq",
]);

/** Staff routes allowed while first-time setup is still incomplete. */
export const ONBOARDING_ALLOWED_PATHS = [
  "/staff/onboarding",
  "/staff/rooms/definitions",
  "/staff/site-builder",
];

export function isOnboardingAllowedPath(pathname: string): boolean {
  return ONBOARDING_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`)
  );
}

export function isProfileSectionStep(id: string): id is ProfileSectionId {
  return PROFILE_SECTION_IDS.has(id as ProfileSectionId);
}

export function normalizeOnboarding(raw: unknown): OnboardingPayload {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const stepsRaw = Array.isArray(r.steps) ? r.steps : Array.isArray(r.Steps) ? r.Steps : [];
  const steps: OnboardingStep[] = stepsRaw.map((item) => {
    const s = item as Record<string, unknown>;
    const id = String(s.id ?? s.Id ?? "");
    const apiRequired = s.required ?? s.Required;
    const required =
      apiRequired === false || apiRequired === "false"
        ? false
        : OPTIONAL_STEP_IDS.has(id)
          ? false
          : Boolean(apiRequired ?? true);
    return {
      id,
      title: String(s.title ?? s.Title ?? s.label ?? s.Label ?? id),
      description: String(s.description ?? s.Description ?? ""),
      done: Boolean(s.done ?? s.isComplete ?? s.IsComplete),
      actionLabel: String(s.actionLabel ?? s.ActionLabel ?? "Open"),
      sectionId: s.sectionId != null ? String(s.sectionId) : s.SectionId != null ? String(s.SectionId) : undefined,
      href: s.href != null ? String(s.href) : s.Href != null ? String(s.Href) : undefined,
      group: String(s.group ?? s.Group ?? "General"),
      required,
      stepType: String(s.stepType ?? s.StepType ?? "profile") as OnboardingStepType,
    };
  });

  const currentStepId = String(r.currentStepId ?? r.CurrentStepId ?? "").trim() || undefined;

  return {
    steps,
    percent: Number(r.percent ?? r.Percent ?? 0),
    completedCount: Number(r.completedCount ?? r.CompletedCount ?? 0),
    totalCount: Number(r.totalCount ?? r.TotalCount ?? steps.length),
    isComplete: Boolean(r.isComplete ?? r.IsComplete),
    currentStepId,
  };
}

export function firstIncompleteStep(steps: OnboardingStep[]): OnboardingStep | undefined {
  return steps.find((s) => !s.done);
}

export function nextStep(steps: OnboardingStep[], currentId: string): OnboardingStep | undefined {
  const idx = steps.findIndex((s) => s.id === currentId);
  if (idx < 0) return steps[0];
  return steps[idx + 1];
}

export function prevStep(steps: OnboardingStep[], currentId: string): OnboardingStep | undefined {
  const idx = steps.findIndex((s) => s.id === currentId);
  if (idx <= 0) return undefined;
  return steps[idx - 1];
}

export function resolveStepId(
  steps: OnboardingStep[],
  requested?: string | null,
  resumeStepId?: string | null
): string {
  if (requested && steps.some((s) => s.id === requested)) return requested;
  if (resumeStepId && steps.some((s) => s.id === resumeStepId && !s.done)) return resumeStepId;
  if (resumeStepId && steps.some((s) => s.id === resumeStepId)) {
    return firstIncompleteStep(steps)?.id ?? resumeStepId;
  }
  return firstIncompleteStep(steps)?.id ?? steps[0]?.id ?? "basic";
}
