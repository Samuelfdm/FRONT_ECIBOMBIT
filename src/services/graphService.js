import { InteractionRequiredAuthError } from "@azure/msal-browser";

export const getUserFromApiGraph = async (instance, accounts) => {
  if (accounts.length === 0) return null;

  const request = {
    scopes: ["User.Read"], // Permiso necesario
    account: accounts[0], 
  };

  try {
    const response = await instance.acquireTokenSilent(request);
    const accessToken = response.accessToken;

    const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return await graphResponse.json();
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      try {
        const response = await instance.acquireTokenPopup(request);
        const accessToken = response.accessToken;

        const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        return await graphResponse.json();
      } catch (popupError) {
        console.error("Error al obtener el token:", popupError);
      }
    } else {
      console.error("Error en la autenticación:", error);
    }
    return null;
  }
};
