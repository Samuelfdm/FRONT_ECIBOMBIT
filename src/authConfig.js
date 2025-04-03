import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "8ac06538-23db-40ee-8248-804535035221", // Reemplaza con el Client ID de Azure
    authority: "https://login.microsoftonline.com/9dc4175a-6862-48a3-b836-f693f6327e6b", // Reemplaza con el Tenant ID
    redirectUri: "http://localhost:5173", // Debe coincidir con la configuración en Azure
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);