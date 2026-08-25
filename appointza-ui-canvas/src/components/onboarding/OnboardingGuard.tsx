import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useAuth } from '@/contexts/AuthContext';
import { ORGANIZATION_ONBOARDING_ROUTES } from '@/utils/organizationOnboarding.util';

interface OnboardingGuardProps {
  children: React.ReactNode;
  allowedRoutes?: string[];
}

export const OnboardingGuard = ({ children, allowedRoutes = [] }: OnboardingGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userType, isAuthenticated } = useAuth();
  const { isComplete, isLoading, nextStep, refetch } = useOnboardingStatus();
  const hasRedirected = useRef(false);

  const onboardingRoutes = [...ORGANIZATION_ONBOARDING_ROUTES];

  const allAllowedRoutes = [...onboardingRoutes, ...allowedRoutes];

  const isAllowedRoute = allAllowedRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    if (!isAuthenticated || userType !== 'organization' || !user?.organisationid) {
      return;
    }

    if (isComplete || isAllowedRoute) {
      return;
    }

    void refetch();
  }, [isAuthenticated, userType, user?.organisationid, isComplete, isAllowedRoute, refetch]);

  useEffect(() => {
    hasRedirected.current = false;

    if (!isAuthenticated || userType !== 'organization' || !user?.organisationid) {
      return;
    }

    if (isAllowedRoute) {
      return;
    }

    if (isComplete) {
      hasRedirected.current = false;
      return;
    }

    if (isLoading) {
      return;
    }

    if (hasRedirected.current) {
      return;
    }

    if (nextStep === 'customDomain') {
      hasRedirected.current = true;
      navigate('/organization/custom-domain', {
        replace: true,
        state: { from: location.pathname, onboarding: true },
      });
    } else if (nextStep === 'services') {
      hasRedirected.current = true;
      navigate('/organization/services', {
        replace: true,
        state: { from: location.pathname, onboarding: true },
      });
    } else if (nextStep === 'website') {
      hasRedirected.current = true;
      navigate('/organization/templates', {
        replace: true,
        state: { from: location.pathname, onboarding: true },
      });
    } else if (nextStep === 'timing') {
      hasRedirected.current = true;
      navigate('/organization/timing', {
        replace: true,
        state: { from: location.pathname, onboarding: true },
      });
    }
  }, [isAuthenticated, userType, user, isComplete, isLoading, nextStep, navigate, location.pathname, isAllowedRoute]);

  return <>{children}</>;
};
