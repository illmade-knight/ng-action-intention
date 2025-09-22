import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


/**
 * A component that acts as the redirect target after a successful
 * Google login. It reads the pre-fetched auth state and navigates
 * the user to their main messaging interface.
 */
@Component({
  standalone: true,
  selector: 'app-login-success',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './login-success.html',
})
export class LoginSuccessComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  statusMessage = signal('Finalizing login...');

  ngOnInit(): void {
    // The APP_INITIALIZER has already run checkAuthStatus.
    // We can now synchronously check the result from the service's signals.
    if (this.authService.isAuthenticated()) {
      this.statusMessage.set('Success! Redirecting to messenger...');
      // Use a minimal timeout to allow the status message to render briefly
      setTimeout(() => this.router.navigate(['/messaging']), 50);
    } else {
      this.statusMessage.set('Authentication failed. Redirecting to login...');
      console.error('[Angular ERROR] LoginSuccessComponent: Auth state is not authenticated after redirect.');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { error: 'auth_sync_failed' } });
      }, 2500); // Delay to allow reading the error message
    }
  }
}
