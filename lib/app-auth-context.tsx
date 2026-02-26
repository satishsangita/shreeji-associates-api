import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_TOKEN_KEY = "shreeji_app_token";
const APP_USER_KEY = "shreeji_app_user";

export type AppUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "approved" | "rejected";
};

type AppAuthState = {
  token: string | null;
  user: AppUser | null;
  loading: boolean;
};

type AppAuthContextType = AppAuthState & {
  login: (token: string, user: AppUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (user: AppUser) => Promise<void>;
};

const AppAuthContext = createContext<AppAuthContextType | null>(null);

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppAuthState>({ token: null, user: null, loading: true });

  useEffect(() => {
    (async () => {
      try {
        const [token, userStr] = await Promise.all([
          AsyncStorage.getItem(APP_TOKEN_KEY),
          AsyncStorage.getItem(APP_USER_KEY),
        ]);
        if (token && userStr) {
          setState({ token, user: JSON.parse(userStr), loading: false });
        } else {
          setState({ token: null, user: null, loading: false });
        }
      } catch {
        setState({ token: null, user: null, loading: false });
      }
    })();
  }, []);

  const login = useCallback(async (token: string, user: AppUser) => {
    await AsyncStorage.setItem(APP_TOKEN_KEY, token);
    await AsyncStorage.setItem(APP_USER_KEY, JSON.stringify(user));
    setState({ token, user, loading: false });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(APP_TOKEN_KEY);
    await AsyncStorage.removeItem(APP_USER_KEY);
    setState({ token: null, user: null, loading: false });
  }, []);

  const refreshUser = useCallback(async (user: AppUser) => {
    await AsyncStorage.setItem(APP_USER_KEY, JSON.stringify(user));
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AppAuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AppAuthContext);
  if (!ctx) throw new Error("useAppAuth must be used inside AppAuthProvider");
  return ctx;
}
