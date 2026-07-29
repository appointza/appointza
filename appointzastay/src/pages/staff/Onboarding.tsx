import { useCallback, useEffect, useMemo, type CSSProperties } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProfileSectionContent } from "@/components/organisation/ProfileSectionContent";
import { Button } from "@/components/ui/button";
import { stayApi } from "@/services/stay.service";
import type { ProfileSectionId } from "@/models/stay";
import { keysToCamelCase } from "@/models/organisationProfile";
import {
  isProfileSectionStep,
  normalizeOnboarding,
  nextStep,
  prevStep,
  resolveStepId,
} from "@/config/onboardingSteps";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import "@/components/organisation/organisation-profile.css";
import "@/components/onboarding/onboarding.css";

/**
 * Full-page first-time property setup — one section at a time with saved progress.
 * Resume after logout/login via currentStepId from the API.
 */
export default function OnboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const requestedStep = searchParams.get("step");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["onboarding", requestedStep],
    queryFn: () => stayApi.dashboard.onboarding(),
  });

  const onboarding = useMemo(
    () => normalizeOnboarding(data?.onboarding),
    [data?.onboarding]
  );

  const stepId = resolveStepId(onboarding.steps, requestedStep, onboarding.currentStepId);
  const currentStep = onboarding.steps.find((s) => s.id === stepId);
  const stepIndex = onboarding.steps.findIndex((s) => s.id === stepId);
  const isProfileStep = isProfileSectionStep(stepId);

  const { data: orgData, isLoading: orgLoading, refetch: refetchOrg } = useQuery({
    queryKey: ["onboarding-org", stepId],
    queryFn: () =>
      stayApi.organisation.index(
        isProfileStep ? stepId : undefined,
        isProfileStep ? stepId : undefined
      ),
    enabled: isProfileStep,
  });

  const org = useMemo(
    () =>
      (orgData?.organisation ??
        keysToCamelCase((data?.organisation as Record<string, unknown>) ?? {})) as Record<
        string,
        unknown
      >,
    [orgData?.organisation, data?.organisation]
  );
  const assets = (orgData?.assets ?? org.assets ?? []) as Record<string, unknown>[];
  const logoUrl = orgData?.logoUrl;
  const roomCount = Number(data?.roomCount ?? orgData?.roomCount ?? 0);
  const propertyName = String(org.name || "your property");

  const goToStep = useCallback(
    (id: string) => {
      setSearchParams({ step: id });
      void stayApi.dashboard.setStep(id).catch(() => undefined);
    },
    [setSearchParams]
  );

  // Keep URL in sync with resume step on first load.
  useEffect(() => {
    if (isLoading || requestedStep || !stepId) return;
    setSearchParams({ step: stepId }, { replace: true });
  }, [isLoading, requestedStep, stepId, setSearchParams]);

  const invalidateAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    await queryClient.invalidateQueries({ queryKey: ["onboarding-gate"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await queryClient.invalidateQueries({ queryKey: ["site-builder"] });
    await queryClient.invalidateQueries({ queryKey: ["property"] });
    await refetch();
  }, [queryClient, refetch]);

  const markAndAdvance = useCallback(
    async (id: string, skipped = false) => {
      await stayApi.dashboard.markStep(id, skipped);
      const following = nextStep(onboarding.steps, id);
      await invalidateAll();
      if (following) {
        goToStep(following.id);
      } else {
        navigate("/staff/dashboard");
      }
    },
    [goToStep, invalidateAll, navigate, onboarding.steps]
  );

  const handleSaved = useCallback(
    async (section: ProfileSectionId) => {
      await refetchOrg();
      await markAndAdvance(section, false);
    },
    [markAndAdvance, refetchOrg]
  );

  const handleBack = useCallback(() => {
    const previous = prevStep(onboarding.steps, stepId);
    if (previous) goToStep(previous.id);
  }, [goToStep, onboarding.steps, stepId]);

  const handleSkip = useCallback(async () => {
    if (!currentStep || currentStep.required) return;
    await markAndAdvance(stepId, true);
  }, [currentStep, markAndAdvance, stepId]);

  if (isLoading) {
    return (
      <div className="onboard-fullscreen">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (onboarding.isComplete && !requestedStep) {
    return (
      <div className="onboard-fullscreen">
        <div className="onboard-finish-card space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
          <p className="text-muted-foreground">
            {propertyName} is ready. Manage bookings, rooms, and your website from the dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild>
              <Link to="/staff/dashboard">Go to dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/property" target="_blank">
                Preview website <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard-fullscreen">
      <header className="onboard-full-header">
        <div className="onboard-full-brand">
          <span className="font-display text-base sm:text-lg font-bold leading-tight">
            Appointza<span className="text-primary">Stay</span>
          </span>
          <span className="hidden text-xs text-muted-foreground sm:inline">Property setup</span>
        </div>
        <div className="onboard-full-progress">
          <div className="onboard-ring" style={{ "--progress": onboarding.percent } as CSSProperties}>
            <span>{onboarding.percent}%</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Step {Math.max(1, stepIndex + 1)} of {onboarding.totalCount}
            </p>
            <p className="truncate text-sm font-semibold">{currentStep?.title ?? "Setup"}</p>
            <div className="onboard-bar mt-2">
              <div className="onboard-bar-fill" style={{ width: `${onboarding.percent}%` }} />
            </div>
          </div>
        </div>
        <button
          type="button"
          className="onboard-signout"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Save &amp; exit</span>
        </button>
      </header>

      <div className="onboard-step-rail" aria-hidden>
        {onboarding.steps.map((s, i) => {
          const canOpen = s.done || s.id === stepId || i <= stepIndex;
          return (
            <button
              key={s.id}
              type="button"
              title={s.title}
              className={`onboard-step-dot${s.done ? " is-done" : ""}${s.id === stepId ? " is-active" : ""}`}
              disabled={!canOpen}
              onClick={() => {
                if (canOpen) goToStep(s.id);
              }}
            >
              {s.done ? <Check className="h-3 w-3" /> : i + 1}
            </button>
          );
        })}
      </div>

      <main className="onboard-full-main">
        <div className="onboard-full-card">
          <div className="onboard-full-card-head">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {currentStep?.group ?? "Setup"}
                {!currentStep?.required ? " · Optional" : ""}
              </p>
              <h1 className="mt-1 font-display font-bold tracking-tight">
                {currentStep?.title ?? "Setup"}
              </h1>
              {currentStep?.description ? (
                <p className="onboard-step-desc">{currentStep.description}</p>
              ) : null}
            </div>
          </div>

          <div className="onboard-full-card-body">
            {isProfileStep ? (
              orgLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ProfileSectionContent
                  key={`onboard-${stepId}`}
                  section={stepId}
                  editing={stepId !== "uploads"}
                  org={org}
                  assets={assets}
                  logoUrl={logoUrl}
                  owner={orgData?.owner}
                  roomCount={roomCount}
                  onCancel={handleBack}
                  onSaved={handleSaved}
                  onRefresh={() => {
                    void refetchOrg();
                  }}
                  onboarding
                  allowSkip={!currentStep?.required}
                  onSkip={() => void handleSkip()}
                />
              )
            ) : stepId === "rooms" ? (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Add at least one room with number, rates, and capacity so guests can book.
                </p>
                <p className="text-sm">
                  {roomCount > 0 ? (
                    <span className="font-semibold text-primary">{roomCount} room(s) ready.</span>
                  ) : (
                    <span className="text-muted-foreground">No rooms yet.</span>
                  )}
                </p>
                <Button asChild size="lg">
                  <Link to="/staff/rooms/definitions?create=true">Add room</Link>
                </Button>
              </div>
            ) : stepId === "site-builder" ? (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Your website is built from the details you entered. Review it, then finish setup.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link to="/staff/site-builder">Open site builder</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/property" target="_blank">
                      Preview site <ExternalLink className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {(!isProfileStep || stepId === "uploads") && (
            <div className="onboard-wizard-footer">
              <Button type="button" variant="outline" onClick={handleBack} disabled={stepIndex <= 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                {stepId === "uploads" && (
                  <Button type="button" onClick={() => void handleSaved("uploads")}>
                    Save &amp; continue <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
                {roomCount > 0 && stepId === "rooms" && (
                  <Button type="button" onClick={() => void markAndAdvance("rooms", false)}>
                    Continue <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
                {stepId === "site-builder" && (
                  <Button type="button" onClick={() => void markAndAdvance("site-builder", false)}>
                    Finish setup <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="onboard-resume-hint">
          Progress is saved automatically. Sign out anytime — when you sign back in, you&apos;ll continue from this
          step.
        </p>
      </main>
    </div>
  );
}
