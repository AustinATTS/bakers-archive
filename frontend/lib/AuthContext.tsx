/**
 * Authentication context for The Baker's Archive.
 */
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  AuthUser,
  clearToken,
  fetchMe,
  getToken,
  login as authLogin,
  setToken,
} from './auth';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  token: null,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }
    fetchMe(storedToken)
      .then((me) => {
        setUser(me);
        setTokenState(storedToken);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    const newToken = await authLogin(username, password);
    setToken(newToken);
    setTokenState(newToken);
    const me = await fetchMe(newToken);
    setUser(me);
  }, []);

  const logout = useCallback((): void => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}