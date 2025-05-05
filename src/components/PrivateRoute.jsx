import { useIsAuthenticated } from "@azure/msal-react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const isAuthenticated = useIsAuthenticated();
    return isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;
