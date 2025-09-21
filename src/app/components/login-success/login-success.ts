import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


/**
 * A component that acts as the redirect target after a successful
 * Google login. It verifies the session and navigates the user
 * to their main messaging interface.
 */
@Component({
  standalone: true,
  selector: 'app-login-success',
  imports: [CommonModule, MatProgressSpinnerModule],
  // UPDATED: This now correctly points to the external template file.
  templateUrl: './login-success.html',
})
export class LoginSuccessComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Use a signal to provide visible feedback to the user.
  statusMessage = signal('Finalizing login...');

  ngOnInit(): void {
    this.statusMessage.set('Syncing session with the server...');
    console.log('[Angular LOG] LoginSuccessComponent: ngOnInit - Starting session sync.');

    this.authService.checkAuthStatus().subscribe(() => {
      console.log('[Angular LOG] LoginSuccessComponent: checkAuthStatus() completed.');
      const user = this.authService.currentUser();
      const isAuthenticated = this.authService.isAuthenticated();

      console.log(`[Angular LOG] LoginSuccessComponent: IsAuthenticated signal is now: ${isAuthenticated}`);
      console.log('[Angular LOG] LoginSuccessComponent: CurrentUser signal is now:', user);

      if (user && isAuthenticated) {
        this.statusMessage.set('Success! Redirecting to messenger...');
        this.router.navigate(['/messaging']);
      } else {
        this.statusMessage.set('Authentication failed. Redirecting to login...');
        console.error('[Angular ERROR] LoginSuccessComponent: Auth check failed after redirect. User is not authenticated.');
        setTimeout(() => {
          this.router.navigate(['/login'], { queryParams: { error: 'auth_sync_failed' } });
        }, 2500); // Delay to allow reading the message
      }
    });
  }
}

