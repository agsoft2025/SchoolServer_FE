import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";
import { logoutService, sessionService } from "../service/authService";

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
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const payload = await sessionService();
        const nextUser = payload?.user ?? null;

        if (!cancelled) {
          setUser(nextUser);

          if (nextUser) {
            setCookie(USER_COOKIE_KEY, nextUser, { maxAge: COOKIE_MAX_AGE_SEC });
          } else {
            deleteCookie(USER_COOKIE_KEY);
          }
        }
      } catch {
        if (!cancelled) {
          deleteCookie(USER_COOKIE_KEY);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (payload) => {
    const nextUser = payload?.user ?? payload ?? { role: "user" };

    setUser(nextUser);
    setCookie(USER_COOKIE_KEY, nextUser, { maxAge: COOKIE_MAX_AGE_SEC });
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch {
      // Client cleanup still matters even if the request fails.
    } finally {
      deleteCookie(USER_COOKIE_KEY);
      setUser(null);
      window.location.href = "/login";
    }
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
