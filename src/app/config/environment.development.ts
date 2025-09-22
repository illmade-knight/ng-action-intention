// src/app/config/environment.development.ts

import {Environment} from './enviroment.model';

export const environment: Environment = {
  production: false,
  identityServiceUrl: 'http://localhost:3000',
  messagingServiceUrl: 'http://localhost:3001',
  keyServiceUrl: 'http://localhost:8081',
  routingServiceUrl: 'http://localhost:8082',
};
