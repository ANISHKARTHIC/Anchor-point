
import { ROUTE } from "../constants/routes";
import { Navigate, Outlet } from 'react-router-dom';
function PrivateRoute() {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  return (
      isAuthenticated == "true" ? <Outlet/> : <Navigate to={ROUTE.LOGIN} />
  );
}
export default PrivateRoute;