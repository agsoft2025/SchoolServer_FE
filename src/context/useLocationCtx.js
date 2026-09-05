import { useContext } from "react";
import { LocationContext } from "./LocationContextValue";

export const useLocationCtx = () => useContext(LocationContext);