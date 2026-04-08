import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLocationsQuery } from "../hooks/useLocationMutation";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";

const LocationContext = createContext(null);
const LOCATION_COOKIE_KEY = "selectedLocation";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function LocationProvider({ children }) {
  const { isAuth, booting } = useAuth();

  const [selectedLocation, setSelectedLocation] = useState(null);

  const locationsQuery = useLocationsQuery(isAuth && !booting);

  // restore from cookie
  useEffect(() => {
    const saved = getCookie(LOCATION_COOKIE_KEY);
    if (saved) {
      try {
        setSelectedLocation(JSON.parse(saved));
      } catch {
        deleteCookie(LOCATION_COOKIE_KEY);
      }
    }
  }, []);

  // set default from API
  useEffect(() => {
    const list = locationsQuery.data?.data;
    if (!Array.isArray(list) || list.length === 0) return;

    // 1) if there is a selected location, refresh it from list (updates the cookie too)
    if (selectedLocation?._id) {
      const latest = list.find((x) => x._id === selectedLocation._id);

      // if still exists, update state/cookie with the latest object
      if (latest) {
        // avoid unnecessary re-renders
        const changed = JSON.stringify(latest) !== JSON.stringify(selectedLocation);
        if (changed) {
          setSelectedLocation(latest);
          setCookie(LOCATION_COOKIE_KEY, latest, { maxAge: COOKIE_MAX_AGE_SEC });
        }
        return;
      }
    }

    // 2) if no selection or it was deleted, pick first as default
    const first = list[0];
    setSelectedLocation(first);
    setCookie(LOCATION_COOKIE_KEY, first, { maxAge: COOKIE_MAX_AGE_SEC });
  }, [locationsQuery.data, selectedLocation?._id]);

  useEffect(() => {
    if (locationsQuery.isSuccess) {
      const list = locationsQuery.data?.data;
      if (!Array.isArray(list) || list.length === 0) {
        if (selectedLocation) {
          setSelectedLocation(null);
          deleteCookie(LOCATION_COOKIE_KEY);
        }
      }
    }
    if (locationsQuery.isError) {
      if (selectedLocation) {
        setSelectedLocation(null);
        deleteCookie(LOCATION_COOKIE_KEY);
      }
    }
  }, [locationsQuery.data, locationsQuery.isSuccess, locationsQuery.isError, selectedLocation]);


  const selectLocation = (loc) => {
    setSelectedLocation(loc);
    setCookie(LOCATION_COOKIE_KEY, loc, { maxAge: COOKIE_MAX_AGE_SEC });
  };

  const value = useMemo(
    () => ({
      locations: locationsQuery.data?.data || [],
      selectedLocation,
      selectLocation,
      loading: locationsQuery.isLoading,
    }),
    [locationsQuery.data, selectedLocation]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocationCtx = () => useContext(LocationContext);
