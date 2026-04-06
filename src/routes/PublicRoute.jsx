import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ redirectTo = "/dashboard" }) {
  const { isAuth, booting } = useAuth();

  if (booting) return null;

  return isAuth ? <Navigate to={redirectTo} replace /> : <Outlet />;
}
