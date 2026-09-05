import { useMemo, useState } from "react";
import { DBContext } from "./DBContextValue";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";

const DB_COOKIE_KEY = "dbPath";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function DBProvider({ children }) {
  const [dbPath, setDbPath] = useState(() => getCookie(DB_COOKIE_KEY) || "");

  const setPath = (path) => {
    setDbPath(path || "");
    if (path) {
      setCookie(DB_COOKIE_KEY, path, { maxAge: COOKIE_MAX_AGE_SEC });
    } else {
      deleteCookie(DB_COOKIE_KEY);
    }
  };

  const clearPath = () => {
    setDbPath("");
    deleteCookie(DB_COOKIE_KEY);
  };

  const value = useMemo(() => ({ dbPath, setPath, clearPath }), [dbPath]);

  return <DBContext.Provider value={value}>{children}</DBContext.Provider>;
}
