import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  media: number[];
  id: number;
  mobile: string;
  organisationid: number;
  locationid: number;
  username?: string;
  email?: string;
  imageid?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  mobile: string | null;
  setMobile: (mobile: string) => void;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mobile, setMobileState] = useState<string | null>(null);
  const navigate = useNavigate();

  const refreshAuth = () => {
    const token = localStorage.getItem('auth_token');
    const userContextStr = localStorage.getItem('user_context');
    
    if (token && userContextStr) {
      try {
        const userContext = JSON.parse(userContextStr);
        
        setIsAuthenticated(true);
        setUser({
          media: userContext.media || [],
          id: userContext.userid || 0,
          mobile: userContext.usermobile || '',
          organisationid: userContext.organisationid || 0,
          locationid: userContext.organisationlocationid || 0,
          username: userContext.username || '',
          email: userContext.useremail || '',
          imageid: userContext.userimageid || 0
        });
        setMobileState(userContext.usermobile || '');
        
        // Auto-redirect if on login/otp pages
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/otp') {
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 100);
        }
        
      } catch (error) {
        console.error('AuthContext: Error parsing user context:', error);
        setIsAuthenticated(false);
        setUser(null);
        setMobileState(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_context');
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setMobileState(null);
    }
  };

  useEffect(() => {
    refreshAuth();
    
    const handleLoad = () => {
      refreshAuth();
    };
    
    window.addEventListener('load', handleLoad);
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const setMobile = (mobile: string) => {
    setMobileState(mobile);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_context');
    localStorage.removeItem('user_type');
    setIsAuthenticated(false);
    setUser(null);
    setMobileState(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      mobile,
      setMobile,
      logout,
      refreshAuth
    }}>
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

