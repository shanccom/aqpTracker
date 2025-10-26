import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Credentials, ProfileShape } from './authService';
import * as service from './authService';
import LoginModal from './LoginModal';

type AuthContextType = {
  user: ProfileShape | null;
  accessToken: string | null;
  login: (creds: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  openLogin: () => void;
  closeLogin: () => void;
  isLoginOpen: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ProfileShape | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoginOpen, setLoginOpen] = useState(false);

  // keep refresh in localStorage (simple approach)
  useEffect(() => {
    const refresh = localStorage.getItem('refresh');
    if (refresh) {
      // try to refresh once at startup
      service.refreshToken(refresh).then(r => {
        setAccessToken(r.access);
        if (r.refresh) localStorage.setItem('refresh', r.refresh);
      }).catch(() => {
        localStorage.removeItem('refresh');
      });
    }
  }, []);

  async function login(creds: Credentials) {
    const data = await service.login(creds);
    setAccessToken(data.access);
    localStorage.setItem('refresh', data.refresh);
    setUser(data.profile);
    setLoginOpen(false);
  }

  async function logout() {
    const refresh = localStorage.getItem('refresh');
    await service.logoutServer(refresh || undefined);
    localStorage.removeItem('refresh');
    setAccessToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, accessToken, login, logout, openLogin: () => setLoginOpen(true), closeLogin: () => setLoginOpen(false), isLoginOpen }), [user, accessToken, isLoginOpen]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal open={isLoginOpen} onClose={() => setLoginOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
