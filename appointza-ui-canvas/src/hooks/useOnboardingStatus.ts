import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { PrivilegeUtil } from '@/utils/privilege.util';
import { OrganisationServicesService } from '@/services/organisationservices.service';
import { OrganisationServiceTimingService } from '@/services/organisationservicetiming.service';
import { OrganisationServicesSelectReq } from '@/models/organisationservices.model';
import { OrganisationServiceTimingSelectReq } from '@/models/organisationservicetiming.model';
import { ReferenceValueService } from '@/services/referencevalue.service';
import { ReferenceValueSelectReq } from '@/models/referencevalue.model';
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
import { useOrganisationLocations } from '@/hooks/useOrganisationLocations';

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

export const useOnboardingStatus = () => {
  const { user, isAuthenticated } = useAuth();
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

  const locationsQuery = useOrganisationLocations({
    organisationId: orgId,
    enabled: !!isAuthenticated && orgId > 0 && !isStaff && !cachedComplete,
  });

  const { data: status, isLoading: onboardingLoading, error, refetch } = useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status', organizationId],
    queryFn: async () => {
      const timeoutPromise = new Promise<OnboardingStatus>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Onboarding status check timed out'));
        }, 10000);
      });

      const fetchPromise = (async () => {
        const locations = locationsQuery.data ?? [];
        const hasCustomDomain = locations.some(
          (loc) => !!normalizeCustomUrlSlug(loc.customurl),
        );

        const referenceValueService = new ReferenceValueService();
        const templateReq = new ReferenceValueSelectReq();
        templateReq.referencetypeid = ORG_WEBSITE_TEMPLATE_REFERENCE_TYPE_ID;
        templateReq.organisationid = organizationId!;
        const orgTemplates = await referenceValueService.select(templateReq);
        const orgTemplateIds = new Set(
          (orgTemplates ?? []).map((template) => template.id).filter((id) => id > 0),
        );
        const hasWebsite = orgHasWebsiteFromLocations(locations, orgTemplateIds);

        const servicesService = new OrganisationServicesService();
        const servicesReq = new OrganisationServicesSelectReq();
        servicesReq.organisationid = organizationId!;
        const services = await servicesService.select(servicesReq);
        const hasServices = services && services.length > 0;

        const timingService = new OrganisationServiceTimingService();
        const timingReq = new OrganisationServiceTimingSelectReq();
        timingReq.organisationid = organizationId!;
        const timings = await timingService.select(timingReq);
        const hasTiming = timings && timings.length > 0;

        const isComplete = hasCustomDomain && hasServices && hasWebsite && hasTiming;
        const nextStep = resolveNextStep(hasCustomDomain, hasServices, hasWebsite, hasTiming);

        return {
          hasCustomDomain,
          hasServices,
          hasWebsite,
          hasTiming,
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
      }
    },
    enabled:
      !!isAuthenticated &&
      !!organizationId &&
      !isStaff &&
      !cachedComplete &&
      locationsQuery.isSuccess,
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
    }
    setCacheBypass(true);
    return refetch().finally(() => setCacheBypass(false));
  }, [organizationId, refetch]);

  const isLoading = cachedComplete
    ? false
    : locationsQuery.isLoading || onboardingLoading;

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
