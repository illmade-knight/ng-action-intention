import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth';

/**
 * A guard for public-facing pages like the login screen.
 * If the user is already authenticated, it redirects them to the main
 * application page.
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkAuthStatus().pipe(
    map(() => {
      if (authService.isAuthenticated()) {
        // If logged in, redirect away from the login page to the main app.
        return router.createUrlTree(['/messaging']);
      }
      // If not logged in, allow access to the public page.
      return true;
    })
  );
};

