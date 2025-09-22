import { HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { environment } from '../config/environment';

/**
 * An HttpInterceptor that intelligently handles authentication for our microservices.
 *
 * - For requests to the `node-identity-service`, it attaches session credentials (`withCredentials: true`).
 * - For all other backend API calls (messaging, key, routing services), it attaches
 * the JWT as a Bearer token in the Authorization header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let authReq = req;

  // Check if the request is destined for the identity service.
  if (req.url.startsWith(environment.identityServiceUrl)) {
    // For the identity service, we use cookie-based sessions.
    authReq = req.clone({
      withCredentials: true,
    });
  } else {
    // For all other microservices, we use the JWT.
    const token = authService.getToken();
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  // Pass the modified request to the next handler.
  return next(authReq);
};

/**
 * An HttpInterceptorFn that attaches credentials to every outgoing HTTP request.
 * This ensures that session cookies are sent to the backend API.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and set the withCredentials property to true.
  const authReq = req.clone({
    withCredentials: true,
  });

  // Pass the cloned request instead of the original request to the next handler.
  return next(authReq);
};
