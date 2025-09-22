// src/app/config/environment.model.ts
export interface Environment {
  production: boolean;
  identityServiceUrl: string;
  messagingServiceUrl: string;
  keyServiceUrl: string;
  routingServiceUrl: string;
}
