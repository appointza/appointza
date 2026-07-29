import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, getStayUser, clearStaySession } from "@/services/auth.service";
import type { AppointzaStayAuthRes } from "@/models/stay";
import { isStaffRole, isPlatformAdminRole } from "@/models/stay";

interface AuthContextValue {
  user: AppointzaStayAuthRes | null;
  isStaff: boolean;
  isPlatformAdmin: boolean;
  authReady: boolean;
  login: (login: string, password: string) => Promise<AppointzaStayAuthRes>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppointzaStayAuthRes | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setUser(getStayUser());
    setAuthReady(true);

    const onExpired = () => {
      clearStaySession();
      setUser(null);
    };
    window.addEventListener("appointzastay:session-expired", onExpired);
    return () => window.removeEventListener("appointzastay:session-expired", onExpired);
  }, []);

  const login = async (loginId: string, password: string) => {
    const session = await authService.login({ login: loginId, password });
    setUser(session);
    return session;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isStaff: isStaffRole(user?.role),
        isPlatformAdmin: isPlatformAdminRole(user?.role),
        authReady,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
