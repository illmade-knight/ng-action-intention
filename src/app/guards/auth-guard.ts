import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth';

/**
 * A functional route guard that ensures the user is authenticated
 * before allowing access to a protected route.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // The service is now optimized to only hit the backend once.
  return authService.checkAuthStatus().pipe(
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }
      // If not authenticated, redirect to the login page.
      return router.createUrlTree(['/login']);
    })
  );
};

