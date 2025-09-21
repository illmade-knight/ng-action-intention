// src/app/auth.config.ts
import { AuthConfig } from 'angular-oauth2-oidc';

export const authCodeFlowConfig: AuthConfig = {
  // Issuer server
  issuer: 'https://accounts.google.com',

  // URL of the SPA to redirect the user to after login
  redirectUri: window.location.origin,

  // The SPA's id. The SPA is registerd with this id at the auth-server
  clientId: '885150127230-v1co0gles0clk1ara7h63qirvcjd59g8.apps.googleusercontent.com', // <-- PASTE YOUR CLIENT ID HERE

  // Scopes that you want to request
  scope: 'openid profile email',

  // Google's discovery document has some non-standard properties.
  // This flag allows the library to work with it.
  strictDiscoveryDocumentValidation: false,
};
