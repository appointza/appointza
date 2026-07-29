import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { UserTypeUtil } from '@/utils/userType.util';
import { PrivilegeUtil } from '@/utils/privilege.util';
import { OrganisationServicesService } from '@/services/organisationservices.service';
import { OrganisationServiceTimingService } from '@/services/organisationservicetiming.service';
import { OrganisationServicesSelectReq } from '@/models/organisationservices.model';
import { OrganisationServiceTimingSelectReq } from '@/models/organisationservicetiming.model';
import { useState, useEffect } from 'react';

export interface OnboardingStatus {
  hasServices: boolean;
  hasTiming: boolean;
  isComplete: boolean;
  isLoading: boolean;
  nextStep: 'services' | 'timing' | null;
}

export const useOnboardingStatus = () => {
  const { user, isAuthenticated } = useAuth();
  const organizationId = user?.organisationid;
  const isStaff = user?.isStaff === true;
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  // For staff users, check if they have dashboard access
  // If staff doesn't have dashboard access, they should not be able to proceed
  const staffHasDashboardAccess = isStaff 
    ? PrivilegeUtil.hasDashboardAccess(user?.userpermission)
    : true;
  
  // Always call hooks first (React rules)
  const { data: status, isLoading, error, refetch } = useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status', organizationId],
    queryFn: async () => {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<OnboardingStatus>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Onboarding status check timed out'));
        }, 10000); // 10 second timeout
      });

      const fetchPromise = (async () => {
        try {
          // Check if organization has at least one service
          const servicesService = new OrganisationServicesService();
          const servicesReq = new OrganisationServicesSelectReq();
          servicesReq.organisationid = organizationId!;
          const services = await servicesService.select(servicesReq);
          const hasServices = services && services.length > 0;

          // Check if organization has timing configured
          const timingService = new OrganisationServiceTimingService();
          const timingReq = new OrganisationServiceTimingSelectReq();
          timingReq.organisationid = organizationId!;
          const timings = await timingService.select(timingReq);
          const hasTiming = timings && timings.length > 0;

          const isComplete = hasServices && hasTiming;
          const nextStep = !hasServices ? 'services' : !hasTiming ? 'timing' : null;

          const result = {
            hasServices,
            hasTiming,
            isComplete,
            isLoading: false,
            nextStep,
          };

          console.log('📋 Onboarding Status:', {
            hasServices,
            hasTiming,
            isComplete,
            nextStep,
            servicesCount: services?.length || 0,
            timingsCount: timings?.length || 0,
          });

          return result;
        } catch (error) {
          console.error('❌ Error checking onboarding status:', error);
          throw error;
        }
      })();

      try {
        return await Promise.race([fetchPromise, timeoutPromise]);
      } catch (error) {
        console.error('❌ Onboarding status check failed or timed out:', error);
        // Return default values on error/timeout instead of throwing
        return {
          hasServices: false,
          hasTiming: false,
          isComplete: false,
          isLoading: false,
          nextStep: 'services', // Default to services step
        };
      }
    },
    enabled: !!isAuthenticated && !!organizationId && !isStaff,
    staleTime: 30000, // 30 seconds - reasonable cache time
    gcTime: 60000, // 1 minute garbage collection (formerly cacheTime)
    retry: 1, // Only retry once
    retryDelay: 2000, // 2 second delay between retries
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Disable to prevent constant refetching
    refetchOnReconnect: true,
  });

  // Additional timeout check - if query is still loading after 15 seconds, force it to stop
  useEffect(() => {
    if (isLoading && !timeoutReached) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Onboarding status check exceeded 15 seconds, forcing completion');
        setTimeoutReached(true);
      }, 15000);

      return () => clearTimeout(timeout);
    } else if (!isLoading) {
      setTimeoutReached(false);
    }
  }, [isLoading, timeoutReached]);

  // Staff users don't need onboarding setup, but they need dashboard access
  // If staff doesn't have dashboard access, they should see an access denied message
  if (isStaff) {
    return {
      hasServices: staffHasDashboardAccess, // Only true if they have dashboard access
      hasTiming: staffHasDashboardAccess,
      isComplete: staffHasDashboardAccess,
      isLoading: false,
      nextStep: staffHasDashboardAccess ? null : 'services', // This won't be used for staff
    };
  }

  // If not authenticated or no organizationId, return immediately (don't wait)
  if (!isAuthenticated || !organizationId) {
    return {
      hasServices: false,
      hasTiming: false,
      isComplete: false,
      isLoading: false,
      nextStep: null,
    };
  }

  // If timeout reached or error occurred, return default values
  if (timeoutReached || (error && !status)) {
    return {
      hasServices: false,
      hasTiming: false,
      isComplete: false,
      isLoading: false,
      nextStep: 'services',
      refetch: () => refetch(),
    };
  }

  // Return status or default values
  return {
    ...(status || {
      hasServices: false,
      hasTiming: false,
      isComplete: false,
      isLoading: false,
      nextStep: 'services',
    }),
    isLoading: isLoading && !timeoutReached, // Only show loading if not timed out
    refetch: () => refetch(),
  };
};

