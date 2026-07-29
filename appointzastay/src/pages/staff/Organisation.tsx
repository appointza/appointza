import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { ProfileSectionContent } from "@/components/organisation/ProfileSectionContent";
import {
  ProfileHeaderLinks,
  ProfileOutletHeader,
  ProfileSectionMobileSelect,
  ProfileSectionNav,
} from "@/components/organisation/ProfileSectionNav";
import { normalizeSectionId, getSectionDef } from "@/config/profileSections";
import type { ProfileSectionId } from "@/models/stay";
import { stayApi } from "@/services/stay.service";
import { resolveMediaUrl } from "@/utils/environment";
import "@/components/organisation/organisation-profile.css";

export default function OrganisationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const section = normalizeSectionId(searchParams.get("section") || searchParams.get("edit"));
  const editSection = searchParams.get("edit") as ProfileSectionId | null;
  const savedSection = searchParams.get("saved");
  const editing = Boolean(editSection && editSection === section);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["organisation", section, editSection, savedSection],
    queryFn: () => stayApi.organisation.index(section, editSection || undefined, savedSection || undefined),
  });

  const org = (data?.organisation ?? {}) as Record<string, unknown>;
  const assets = (data?.assets ?? org.assets ?? []) as Record<string, unknown>[];
  const def = getSectionDef(section);
  const modeLabel = section === "uploads" ? "Manage" : editing ? "Editing" : "Viewing";

  const setSection = useCallback(
    (id: ProfileSectionId) => {
      setSearchParams({ section: id });
    },
    [setSearchParams]
  );

  const startEdit = useCallback(() => {
    setSearchParams({ section, edit: section });
  }, [section, setSearchParams]);

  const cancelEdit = useCallback(() => {
    setSearchParams({ section });
  }, [section, setSearchParams]);

  const onSaved = useCallback(
    (saved: ProfileSectionId) => {
      setSearchParams({ section: saved, saved });
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["site-builder"] });
      void queryClient.invalidateQueries({ queryKey: ["property"] });
    },
    [queryClient, refetch, setSearchParams]
  );

  const logoUrl = data?.logoUrl;
  const name = String(org.name || "Organisation");
  const tagline = String(org.tagline || "");
  const initial = name.trim() ? name.trim()[0].toUpperCase() : "?";

  const showSavedFlash = savedSection === section;

  const headerUser = useMemo(() => data?.currentUser?.name, [data?.currentUser?.name]);

  return (
    <StaffLayout>
      <div className="org-profile-shell -mx-3 -my-3 sm:-mx-4 sm:-my-3 lg:-mx-5 lg:-my-5 min-h-[calc(100dvh-3rem)] lg:min-h-dvh">
        <header className="org-profile-header">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              {logoUrl ? (
                <img
                  src={resolveMediaUrl(logoUrl)}
                  alt={`${name} logo`}
                  className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl border border-border bg-background object-contain p-1"
                />
              ) : (
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Home</p>
                <h1 className="font-display text-base sm:text-lg font-bold">Organisation detail</h1>
                <p className="mt-0.5 text-sm font-medium truncate">{name}</p>
                {tagline && <p className="text-sm text-muted-foreground line-clamp-2">{tagline}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {headerUser && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {headerUser}
                </span>
              )}
              <ProfileHeaderLinks />
            </div>
          </div>
          <ProfileSectionMobileSelect active={section} onSelect={setSection} />
        </header>

        <div className="org-profile-split">
          <ProfileSectionNav active={section} org={org} assets={assets} onSelect={setSection} />

          <div className="org-profile-outlet">
            <ProfileOutletHeader
              title={def.title}
              mode={modeLabel}
              showEdit={!editing && section !== "uploads"}
              onEdit={startEdit}
            />

            <div className="org-profile-outlet-scroll">
              {isError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-destructive">Could not load organisation profile.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Check that you are signed in and the API server is running.</p>
                  <button
                    type="button"
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                    onClick={() => void refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ProfileSectionContent
                  key={`${section}-${editing ? "edit" : "view"}`}
                  section={section}
                  editing={editing}
                  org={org}
                  assets={assets}
                  logoUrl={logoUrl}
                  owner={data?.owner}
                  roomCount={data?.roomCount}
                  saved={showSavedFlash}
                  onCancel={cancelEdit}
                  onSaved={onSaved}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
