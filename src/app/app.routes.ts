import { Routes } from '@angular/router';

// Import components from their new, correct locations
import { LoginComponent } from './components/login/login';
import { LoginSuccessComponent } from './components/login-success/login-success';
import { MessagingComponent } from './components/messaging/messaging';
import { SettingsComponent } from './components/settings/settings';

// Import guards from their new, correct locations
import { authGuard } from './guards/auth-guard';
import { publicGuard } from './guards/public-guard';

export const routes: Routes = [
  // Public routes, protected by the publicGuard
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard] // Prevent logged-in users from seeing this page
  },
  {
    path: 'login-success',
    component: LoginSuccessComponent,
    // This route does not need a guard, as it handles its own logic and redirection.
  },

  // Protected application routes
  {
    path: 'messaging',
    component: MessagingComponent,
    canActivate: [authGuard] // Protect this route from unauthenticated users
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [authGuard] // Also protected
  },

  // Default route
  {
    path: '**',
    redirectTo: '/messaging',
    pathMatch: 'full'
  }
];

