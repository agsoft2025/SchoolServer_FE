import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./useAuth";
import { LocationContext } from "./LocationContextValue";
import { useLocationsQuery } from "../hooks/useLocationMutation";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";

const LOCATION_COOKIE_KEY = "selectedLocation";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

const getStoredLocation = () => {
  const saved = getCookie(LOCATION_COOKIE_KEY);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    deleteCookie(LOCATION_COOKIE_KEY);
    return null;
  }
};

export function LocationProvider({ children }) {
  const { isAuth, booting } = useAuth();

  const [storedLocation, setStoredLocation] = useState(getStoredLocation);

  const locationsQuery = useLocationsQuery(isAuth && !booting);

  const locations = useMemo(
    () => locationsQuery.data?.data || [],
    [locationsQuery.data]
  );

  const selectedLocation = useMemo(() => {
    if (locationsQuery.isError) {
      return null;
    }

    if (!Array.isArray(locations) || locations.length === 0) {
      return storedLocation;
    }

    if (storedLocation?._id) {
      return (
        locations.find((location) => location._id === storedLocation._id) ||
        locations[0]
      );
    }

    return locations[0];
  }, [locations, locationsQuery.isError, storedLocation]);

  // Keep the cookie synchronized with the effective location.
  useEffect(() => {
    if (selectedLocation) {
      setCookie(LOCATION_COOKIE_KEY, selectedLocation, {
        maxAge: COOKIE_MAX_AGE_SEC,
      });
    } else if (locationsQuery.isError) {
      deleteCookie(LOCATION_COOKIE_KEY);
    }
  }, [selectedLocation, locationsQuery.isError]);

  const selectLocation = useCallback((loc) => {
    setStoredLocation(loc);

    if (loc) {
      setCookie(LOCATION_COOKIE_KEY, loc, {
        maxAge: COOKIE_MAX_AGE_SEC,
      });
    } else {
      deleteCookie(LOCATION_COOKIE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({
      locations,
      selectedLocation,
      selectLocation,
      loading: locationsQuery.isLoading,
    }),
    [
      locations,
      selectedLocation,
      selectLocation,
      locationsQuery.isLoading,
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}