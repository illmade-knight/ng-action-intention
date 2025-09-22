import { ApplicationConfig, APP_INITIALIZER  } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthService } from './services/auth'; // Import AuthService

import { routes } from './app.routes';
// Import the new, more intelligent interceptor.
import { authInterceptor } from './interceptors/auth.interceptor';

// Factory function for the initializer
export function initializeAuth(authService: AuthService) {
  return (): Promise<void> => authService.checkAuthStatus();
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
    provideRouter(routes),
    provideAnimations(),

    // Register the new authInterceptor. This single interceptor now handles
    // both session cookies for the identity service and JWTs for all other services.
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
};

