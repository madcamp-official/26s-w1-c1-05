import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/authApi';
import type {
  LoginRequest,
  SignupRequest,
  UserSummary,
} from '../types/auth';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from './authStorage';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type AuthContextValue = {
  status: AuthStatus;
  user: UserSummary | null;
  token: string | null;
  login: (request: LoginRequest) => Promise<void>;
  signup: (request: SignupRequest) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    if (!token) {
      setStatus('anonymous');
      setUser(null);
      return;
    }

    authApi
      .getMe()
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        clearStoredToken();
        setToken(null);
        setUser(null);
        setStatus('anonymous');
      });
  }, [token]);

  async function login(request: LoginRequest) {
    const response = await authApi.login(request);
    setStoredToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);
    setStatus('authenticated');
  }

  async function signup(request: SignupRequest) {
    const response = await authApi.signup(request);
    setStoredToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);
    setStatus('authenticated');
  }

  function logout() {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setStatus('anonymous');
  }

  async function refreshMe() {
    const me = await authApi.getMe();
    setUser(me);
  }

  const value = useMemo(
    () => ({
      status,
      user,
      token,
      login,
      signup,
      logout,
      refreshMe,
    }),
    [status, user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
