import { createContext, useContext, useMemo, useState } from "react";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";

const AuthContext = createContext(null);
const USER_COOKIE_KEY = "user";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

const getStoredUser = () => {
  const savedUser = getCookie(USER_COOKIE_KEY);

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    deleteCookie(USER_COOKIE_KEY);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [booting] = useState(false);

  const login = (payload) => {
    const nextUser = payload?.user ?? payload ?? { role: "user" };

    setUser(nextUser);
    setCookie(USER_COOKIE_KEY, nextUser, { maxAge: COOKIE_MAX_AGE_SEC });
  };

  const logout = () => {
    deleteCookie(USER_COOKIE_KEY);
    setUser(null);
    window.location.href = "/login";
  };

  const value = useMemo(
    () => ({
      user,
      isAuth: !!user,
      login,
      logout,
      booting,
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
