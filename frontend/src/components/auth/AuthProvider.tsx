import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import * as authService from '../../services/authService';
import { setAccessToken } from '../../api/tokenStore';
import { getProfile } from '../../services/authService';

type Profile = authService.ProfileShape;

type Credentials = { email: string; password: string };

type AuthContextValue = {
  user: Profile | null;
  login: (creds: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  openLogin: () => void;
  openRegister: () => void;
  closeLogin: () => void;
  closeRegister: () => void;
  refreshProfile: () => Promise<Profile | undefined>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<Profile | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Restore session on mount if refresh token exists
  useEffect(() => {
    let mounted = true;
    async function restore() {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) return;
        try {
          const data = await authService.refreshToken(refresh);
          setAccessToken(data.access);
          if (data.refresh) localStorage.setItem('refresh', data.refresh);
          // fetch profile
          const profile = await getProfile();
          if (mounted) {
            setUser(profile);
            // do not auto-navigate after silent session restore — preserve user's current route
            // navigate('/Perfil');
          }
      } catch (e) {
        // failed to restore session
        localStorage.removeItem('refresh');
        setAccessToken(null);
        if (mounted) {
          setUser(null);
          // open login modal to prompt user
          setLoginOpen(true);
        }
      }
    }
    restore();
    // listen for global auth events (e.g., refresh failed in axios interceptor)
    const onLoggedOut = () => {
      setUser(null);
      setLoginOpen(true);
    };
    window.addEventListener('auth:logged_out', onLoggedOut as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('auth:logged_out', onLoggedOut as EventListener);
    };
  }, []);

  async function login(creds: Credentials) {
  const res = await authService.login(creds);
  setAccessToken(res.access);
    if (res.refresh) localStorage.setItem('refresh', res.refresh);
    setUser(res.profile);
    setLoginOpen(false);
    // navigate to profile after login
    navigate('/Perfil');
  }

  // allow manual refresh of profile (useful if admin edits user or to revalidate)
  async function refreshProfile() {
    try {
      const profile = await getProfile();
      setUser(profile);
      return profile;
    } catch (e) {
      // on failure, clear user (or keep existing?) — here we clear tokens
      localStorage.removeItem('refresh');
      setAccessToken(null);
      setUser(null);
      throw e;
    }
  }

  async function logout() {
    const refresh = localStorage.getItem('refresh') || undefined;
    try {
      await authService.logoutServer(refresh);
    } finally {
      localStorage.removeItem('refresh');
      setAccessToken(null);
      setUser(null);
    }
  }

  const value: AuthContextValue = {
    user,
    login,
    logout,
    openLogin: () => setLoginOpen(true),
    openRegister: () => setRegisterOpen(true),
    closeLogin: () => setLoginOpen(false),
    closeRegister: () => setRegisterOpen(false),
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
