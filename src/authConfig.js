import { PublicClientApplication } from "@azure/msal-browser";
const frontendApi = 'http://localhost:5173';
//const frontendApi = 'https://front-client.proudwave-8afe962a.eastus.azurecontainerapps.io';

const msalConfig = {
  auth: {
    clientId: "8ac06538-23db-40ee-8248-804535035221",
    authority: "https://login.microsoftonline.com/9dc4175a-6862-48a3-b836-f693f6327e6b",
    redirectUri: `${frontendApi}`
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);