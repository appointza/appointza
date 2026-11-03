
import React, { useContext, useState, useEffect, useRef, ReactNode, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { environment } from '@/utils/environment';
import { getAuthHeaders } from '@/utils/authSession.util';
import { AuthService } from '@/services/AuthService';
import { UsersPermissionData } from '@/models/users.model';
import { resolvePostLoginPath, USER_POST_LOGIN_PATH } from '@/utils/postAuthNavigation';
import {
  completeAuthNavigation,
  redirectToLogin,
  resolveLoginReturnPath,
} from '@/utils/authNavigation.util';
import { AuthContext, type AuthUser } from '@/contexts/auth-context';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userType, setUserTypeState] = useState<'user' | 'organization' | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mobile, setMobileState] = useState<string | null>(null);
  const [canSwitchMode, setCanSwitchMode] = useState(false);
  /** Result of the server-side super admin check for the current token (null = not checked yet). */
  const [superAdminVerified, setSuperAdminVerified] = useState<{ token: string; value: boolean } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const sessionExpireHandledAtRef = useRef(0);

  const refreshAuth = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    const storedUserType = localStorage.getItem('user_type') as 'user' | 'organization' | null;
    const userContextStr = localStorage.getItem('user_context');
    
    console.log('AuthContext: Refreshing auth state', { token: !!token, storedUserType, userContext: !!userContextStr });
    
    try {
      if (token && userContextStr) {
        try {
        const userContext = JSON.parse(userContextStr);
        
        // Determine user type based on stored data
        let determinedUserType: 'user' | 'organization' = 'user';
        
        // Check if user has organization access
        if (userContext.organisationid && userContext.organisationid > 0) {
          // Check if user is staff (has organisationlocationid > 0) or organization owner
          if (userContext.organisationlocationid && userContext.organisationlocationid > 0) {
            // This is a staff member - they should access organization dashboard
            determinedUserType = 'organization';
            console.log('AuthContext: User is staff member, setting type to organization');
          } else {
            // This is an organization owner
            determinedUserType = 'organization';
            console.log('AuthContext: User is organization owner, setting type to organization');
          }
        } else {
          // Regular user
          determinedUserType = 'user';
          console.log('AuthContext: User is regular user, setting type to user');
        }
        
        // Use stored user type if available, otherwise use determined type
        const finalUserType = storedUserType || determinedUserType;
        
        setIsAuthenticated(true);
        setUserTypeState(finalUserType);
        
        // Check if user is staff: has locationid but no organisationid (or organisationid is 0)
        // Staff members have organisationlocationid > 0 but organisationid === 0
        const isStaff = (userContext.organisationlocationid && userContext.organisationlocationid > 0) && 
                       (!userContext.organisationid || userContext.organisationid === 0);
        
        setUser({
          id: userContext.userid || 0,
          mobile: userContext.usermobile || '',
          organisationid: userContext.organisationid || 0,
          locationid: userContext.organisationlocationid || 0,
          firstname: userContext.username || '',
          lastname: '',
          email: userContext.useremail || '',
          username: userContext.username || '',
          imageid: userContext.userimageid || 0,
          userpermission: userContext.userpermission || new UsersPermissionData(),
          isStaff: isStaff,
          isSuperAdmin: userContext.issuperadmin === true
        });
        setMobileState(userContext.usermobile || '');
        
        // User can switch mode if they have both user and organization access
        setCanSwitchMode(false); // For now, set to false - can be enhanced later
        
        // Store the determined user type if not already stored
        if (!storedUserType) {
          localStorage.setItem('user_type', finalUserType);
        }
        
        console.log('AuthContext: User authenticated as', finalUserType, 'can switch:', false);
        
        // Auto-redirect based on user type if on login/register pages.
        // Use resolveLoginReturnPath so a stashed booking/return URL (sessionStorage,
        // set before redirecting to /login) always wins over the default landing page —
        // otherwise this races with Login.tsx's own post-submit navigation and can bounce
        // the user to the default page (e.g. /explore) instead of back to checkout/booking.
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/otp') {
          const fromPath = resolveLoginReturnPath(locationRef.current);
          const isSuperAdmin = userContext.issuperadmin === true;
          console.log('AuthContext: Auto-redirecting from', currentPath, 'superadmin=', isSuperAdmin);
          setTimeout(() => {
            completeAuthNavigation(
              navigate,
              finalUserType as 'user' | 'organization',
              fromPath,
              { isSuperAdmin },
            );
          }, 100);
        }
        
        } catch (error) {
          console.error('AuthContext: Error parsing user context:', error);
          setIsAuthenticated(false);
          setUserTypeState(null);
          setUser(null);
          setMobileState(null);
          setCanSwitchMode(false);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user_context');
        }
      } else {
        setIsAuthenticated(false);
        setUserTypeState(null);
        setUser(null);
        setMobileState(null);
        setCanSwitchMode(false);
        console.log('AuthContext: User not authenticated');
      }
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
    
    // Listen for page refresh/reload events
    const handleBeforeUnload = () => {
      // This will trigger when user refreshes the page
      console.log('AuthContext: Page is being refreshed');
    };
    
    const handleLoad = () => {
      // This will trigger when page loads (including refresh)
      console.log('AuthContext: Page loaded, checking auth state');
      refreshAuth();
    };
    
    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  useEffect(() => {
    const handler = (evt: Event) => {
      const now = Date.now();
      if (now - sessionExpireHandledAtRef.current < 800) return;
      sessionExpireHandledAtRef.current = now;

      const custom = evt as CustomEvent<{ returnPath?: string }>;
      const from =
        custom.detail?.returnPath || `${window.location.pathname}${window.location.search}`;

      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_context');
      localStorage.removeItem('user_type');
      localStorage.removeItem('user_data');
      localStorage.removeItem('can_switch_mode');

      setIsAuthenticated(false);
      setUserTypeState(null);
      setUser(null);
      setMobileState(null);
      setCanSwitchMode(false);
      setAuthReady(true);

      redirectToLogin(from);
      return;
    };

    window.addEventListener('appointza:session-expired', handler);
    return () => window.removeEventListener('appointza:session-expired', handler);
  }, [navigate]);

  // Confirm the super admin flag with the server (users.isfactory) once per token. Old sessions created
  // before the flag existed pick it up here; a revoked flag is dropped here too. Plain axios is used on
  // purpose so a failure never triggers the global session-expired logout.
  useEffect(() => {
    if (!isAuthenticated || !user || user.id <= 0) return;
    const token = getAuthHeaders().Authorization?.replace(/^Bearer\s+/i, '') || localStorage.getItem('auth_token') || '';
    if (!token || superAdminVerified?.token === token) return;
    let cancelled = false;

    const readFlag = (data: unknown): boolean | null => {
      if (!data || typeof data !== 'object') return null;
      const root = data as Record<string, unknown>;
      const item = (root.item ?? root.Item) as Record<string, unknown> | undefined;
      if (!item || typeof item !== 'object') return null;
      const raw = item.issuperadmin ?? item.IsSuperAdmin ?? item.isSuperAdmin;
      if (typeof raw === 'boolean') return raw;
      if (typeof raw === 'string') return raw.toLowerCase() === 'true';
      return null;
    };

    const applyFlag = (value: boolean) => {
      setSuperAdminVerified({ token, value });
      setUser((prev) => (prev ? { ...prev, isSuperAdmin: value } : prev));
      try {
        const raw = localStorage.getItem('user_context');
        if (!raw) return;
        const ctx = JSON.parse(raw) as Record<string, unknown>;
        ctx.issuperadmin = value;
        localStorage.setItem('user_context', JSON.stringify(ctx));
      } catch {
        // ignore storage errors
      }
    };

    axios
      .get(`${environment.baseurl}/api/Auth/SuperAdminStatus`, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      })
      .then((res) => {
        if (cancelled) return;
        const flag = readFlag(res.data);
        if (flag !== null) applyFlag(flag);
      })
      .catch(() => {
        // Keep whatever the login response said; do not log the user out over this check.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, superAdminVerified?.token]);

  const isSuperAdmin = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const token = getAuthHeaders().Authorization?.replace(/^Bearer\s+/i, '') || localStorage.getItem('auth_token') || '';
    if (superAdminVerified && superAdminVerified.token === token) return superAdminVerified.value;
    return user.isSuperAdmin === true;
  }, [isAuthenticated, user, superAdminVerified]);

  const setUserType = useCallback((type: 'user' | 'organization') => {
    console.log('AuthContext: Setting user type to', type);
    setUserTypeState(type);
    localStorage.setItem('user_type', type);
  }, []);

  const setMobile = useCallback((mobile: string) => {
    setMobileState(mobile);
  }, []);

  const switchToMode = useCallback((mode: 'user' | 'organization') => {
    console.log('AuthContext: switchToMode called with mode =', mode);
    console.log('AuthContext: current canSwitchMode =', canSwitchMode);

    if (!canSwitchMode) {
      console.log('AuthContext: User cannot switch modes');
      return;
    }

    setUserType(mode);

    console.log('AuthContext: Navigating to', mode === 'user' ? USER_POST_LOGIN_PATH : '/organization/dashboard');

    if (mode === 'user') {
      navigate(USER_POST_LOGIN_PATH);
    } else {
      navigate('/organization/dashboard');
    }
  }, [canSwitchMode, navigate, setUserType]);

  const logout = useCallback(() => {
    console.log('AuthContext: Logging out');
    try {
      localStorage.removeItem('superadmin_return_session');
      localStorage.removeItem('superadmin_assuming_org');
    } catch {
      // ignore
    }
    AuthService.logout();
    setIsAuthenticated(false);
    setUserTypeState(null);
    setUser(null);
    setMobileState(null);
    setCanSwitchMode(false);
    setSuperAdminVerified(null);
    navigate('/');
  }, [navigate]);

  const contextValue = useMemo(() => ({
    isAuthenticated,
    authReady,
    userType,
    user,
    isSuperAdmin,
    mobile,
    canSwitchMode,
    setUserType,
    setMobile,
    switchToMode,
    logout,
    refreshAuth,
  }), [authReady, canSwitchMode, isAuthenticated, isSuperAdmin, logout, mobile, refreshAuth, setMobile, setUserType, switchToMode, user, userType]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
