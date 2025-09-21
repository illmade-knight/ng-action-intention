import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './login.html',
})
export class LoginComponent {
  // Use the modern inject() function for dependency injection
  private authService = inject(AuthService);

  // Expose the service's signals directly to the template
  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  /**
   * Calls the AuthService to handle the logout process.
   */
  logout(): void {
    this.authService.logout().subscribe();
  }
}

