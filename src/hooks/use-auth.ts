import { useState, useEffect } from "react";

const TOKEN_KEY = "lt_access";
const USER_KEY = "lt_user";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
};

function dispatchAuthChange() {
  window.dispatchEvent(new Event("lt_auth_change"));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  dispatchAuthChange();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  dispatchAuthChange();
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const sync = () => {
      setToken(localStorage.getItem(TOKEN_KEY));
      const raw = localStorage.getItem(USER_KEY);
      setUser(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener("lt_auth_change", sync);
    return () => window.removeEventListener("lt_auth_change", sync);
  }, []);

  return { token, user, isLoggedIn: !!token };
}
