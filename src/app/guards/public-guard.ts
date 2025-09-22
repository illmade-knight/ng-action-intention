import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth';

/**
 * A guard for public-facing pages like the login screen.
 * If the user is already authenticated, it redirects them to the main
 * application page.
 */

// In public-guard.ts
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/messaging']);
  }
  return true;
};

