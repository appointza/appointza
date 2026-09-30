import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PrivilegeUtil } from '@/utils/privilege.util';
import { OrganisationServicesService } from '@/services/organisationservices.service';
import { OrganisationServiceTimingService } from '@/services/organisationservicetiming.service';
import { normalizeCustomUrlSlug } from '@/utils/slug.util';
import {
  ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID,
  clearOnboardingCompleteCache,
  orgHasWebsiteFromLocations,
  readOnboardingCompleteCache,
  writeOnboardingCompleteCache,
} from '@/utils/organizationOnboarding.util';
import type { OnboardingStepId } from '@/components/onboarding/OrganizationOnboarding';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchOrganisationLocations,
  organisationLocationsQueryKey,
} from '@/hooks/useOrganisationLocations';
import {
  fetchReferenceValues,
  referenceValuesQueryKey,
} from '@/hooks/useReferenceValues';

export interface OnboardingStatus {
  hasCustomDomain: boolean;
  hasServices: boolean;
  hasWebsite: boolean;
  hasTiming: boolean;
  isComplete: boolean;
  isLoading: boolean;
  nextStep: OnboardingStepId | null;
}

const defaultStatus: OnboardingStatus = {
  hasCustomDomain: false,
  hasServices: false,
  hasWebsite: false,
  hasTiming: false,
  isComplete: false,
  isLoading: false,
  nextStep: 'customDomain',
};

const completeStatus: Omit<OnboardingStatus, 'isLoading'> = {
  hasCustomDomain: true,
  hasServices: true,
  hasWebsite: true,
  hasTiming: true,
  isComplete: true,
  nextStep: null,
};

function resolveNextStep(
  hasCustomDomain: boolean,
  hasServices: boolean,
  hasWebsite: boolean,
  hasTiming: boolean,
): OnboardingStepId | null {
  if (!hasCustomDomain) return 'customDomain';
  if (!hasServices) return 'services';
  if (!hasWebsite) return 'website';
  if (!hasTiming) return 'timing';
  return null;
}

export const useOnboardingStatus = (options?: { enabled?: boolean }) => {
  const onboardingEnabled = options?.enabled !== false;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = user?.organisationid;
  const isStaff = user?.isStaff === true;
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [cacheBypass, setCacheBypass] = useState(false);

  const staffHasDashboardAccess = isStaff
    ? PrivilegeUtil.hasDashboardAccess(user?.userpermission)
    : true;

  const orgId = organizationId ?? 0;
  const cachedComplete =
    !cacheBypass && orgId > 0 && readOnboardingCompleteCache(orgId);

  const { data: status, isLoading: onboardingLoading, error, refetch } = useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status', organizationId],
    queryFn: async () => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<OnboardingStatus>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Onboarding status check timed out'));
        }, 10000);
      });

      const fetchPromise = (async () => {
        const orgIdValue = organizationId!;

        // Locations via shared RQ key (dedupes with sidebar / Dashboard useOrganisationLocations).
        // Templates, services, and timings run in parallel with locations.
        const servicesService = new OrganisationServicesService();
        const servicesHasAnyReq = { organisationid: orgIdValue };

        const timingService = new OrganisationServiceTimingService();

        const [locations, orgTemplates, hasServices, hasTiming] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: organisationLocationsQueryKey(orgIdValue, 0),
            queryFn: () => fetchOrganisationLocations(orgIdValue, 0),
            staleTime: 0,
          }),
          queryClient.fetchQuery({
            queryKey: referenceValuesQueryKey(orgIdValue, ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID),
            queryFn: () =>
              fetchReferenceValues(orgIdValue, ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID),
            staleTime: 0,
          }),
          servicesService.hasAny(servicesHasAnyReq),
          timingService.hasAny({ organisationid: orgIdValue }),
        ]);

        const hasCustomDomain = (locations ?? []).some(
          (loc) => !!normalizeCustomUrlSlug(loc.customurl),
        );
        const orgTemplateIds = new Set(
          (orgTemplates ?? []).map((template) => template.id).filter((id) => id > 0),
        );
        const hasWebsite = orgHasWebsiteFromLocations(locations ?? [], orgTemplateIds);
        const hasServicesResolved = hasServices;
        const hasTimingResolved = hasTiming;

        const isComplete = hasCustomDomain && hasServicesResolved && hasWebsite && hasTimingResolved;
        const nextStep = resolveNextStep(hasCustomDomain, hasServicesResolved, hasWebsite, hasTimingResolved);

        return {
          hasCustomDomain,
          hasServices: hasServicesResolved,
          hasWebsite,
          hasTiming: hasTimingResolved,
          isComplete,
          isLoading: false,
          nextStep,
        };
      })();

      try {
        return await Promise.race([fetchPromise, timeoutPromise]);
      } catch (fetchError) {
        console.error('❌ Onboarding status check failed or timed out:', fetchError);
        return { ...defaultStatus };
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }
    },
    enabled: onboardingEnabled && !!isAuthenticated && !!organizationId && !isStaff && !cachedComplete,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    retryDelay: 2000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!organizationId || !status) return;
    writeOnboardingCompleteCache(organizationId, status.isComplete);
  }, [organizationId, status]);

  const invalidateAndRefetch = useCallback(() => {
    if (organizationId) {
      clearOnboardingCompleteCache(organizationId);
      void queryClient.invalidateQueries({
        queryKey: ['organisation-locations', organizationId],
      });
      void queryClient.invalidateQueries({
        queryKey: referenceValuesQueryKey(
          organizationId,
          ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID,
        ),
      });
    }
    setCacheBypass(true);
    return refetch().finally(() => setCacheBypass(false));
  }, [organizationId, queryClient, refetch]);

  const isLoading = cachedComplete ? false : onboardingLoading;

  useEffect(() => {
    if (isLoading && !timeoutReached) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Onboarding status check exceeded 15 seconds, forcing completion');
        setTimeoutReached(true);
      }, 15000);

      return () => clearTimeout(timeout);
    }
    if (!isLoading) {
      setTimeoutReached(false);
    }
  }, [isLoading, timeoutReached]);

  const refetchOnboarding = useMemo(
    () => () => invalidateAndRefetch(),
    [invalidateAndRefetch],
  );

  if (isStaff) {
    return {
      hasCustomDomain: staffHasDashboardAccess,
      hasServices: staffHasDashboardAccess,
      hasWebsite: staffHasDashboardAccess,
      hasTiming: staffHasDashboardAccess,
      isComplete: staffHasDashboardAccess,
      isLoading: false,
      nextStep: staffHasDashboardAccess ? null : 'customDomain',
      refetch: refetchOnboarding,
    };
  }

  if (!isAuthenticated || !organizationId) {
    return {
      ...defaultStatus,
      nextStep: null,
      refetch: refetchOnboarding,
    };
  }

  if (cachedComplete) {
    return {
      ...completeStatus,
      isLoading: false,
      refetch: refetchOnboarding,
    };
  }

  if (timeoutReached || (error && !status)) {
    return {
      ...defaultStatus,
      refetch: refetchOnboarding,
    };
  }

  return {
    ...(status || defaultStatus),
    isLoading: isLoading && !timeoutReached,
    refetch: refetchOnboarding,
  };
};
