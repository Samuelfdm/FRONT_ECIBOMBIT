import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import { callMsGraph } from "../services/graphService";

const ProfileInfo = () => {
  const { instance, accounts } = useMsal();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (accounts.length > 0) {
      const request = {
        ...loginRequest,
        account: accounts[0],
      };

      instance
        .acquireTokenSilent(request)
        .then((response) => callMsGraph(response.accessToken))
        .then((data) => setUserData(data))
        .catch((error) => console.error("Error al obtener datos del usuario:", error));
    }
  }, [accounts, instance]);

  return (
    <div>
      {userData ? (
        <div>
          <h2>Bienvenido, {userData.displayName}</h2>
          <p>Email: {userData.mail || userData.userPrincipalName}</p>
        </div>
      ) : (
        <p>Cargando perfil...</p>
      )}
    </div>
  );
};

export default ProfileInfo;
