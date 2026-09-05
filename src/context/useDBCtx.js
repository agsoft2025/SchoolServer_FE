import { useContext } from "react";
import { DBContext } from "./DBContextValue";

export const useDBCtx = () => {
  const ctx = useContext(DBContext);

  if (!ctx) {
    throw new Error("useDBCtx must be used inside DBProvider");
  }

  return ctx;
};