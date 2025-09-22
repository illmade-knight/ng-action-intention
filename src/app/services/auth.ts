import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, tap, map, of, catchError, firstValueFrom} from 'rxjs';
import { Router } from '@angular/router';

import { UserProfile } from '../models/user';
import { environment } from '../config/environment';

// The shape of the response from the /api/auth/status endpoint
interface AuthStatusResponse {
  authenticated: boolean;
  // The user object from the identity service now includes the JWT
  user: (UserProfile & { token: string }) | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private identityServiceUrl = environment.identityServiceUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals to hold the authentication state
  isAuthenticated: WritableSignal<boolean> = signal(false);
  currentUser: WritableSignal<UserProfile | null> = signal(null);

  // Private state to hold the JWT and track if the initial check has been done
  private jwtToken: string | null = null;
  private readonly TOKEN_STORAGE_KEY = 'app_jwt';

  constructor() {
    // On service initialization, try to load the token from storage to persist the session.
    const storedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    if (storedToken) {
      this.jwtToken = storedToken;
      this.isAuthenticated.set(true); // Set a tentative status until checkAuthStatus confirms
    }
  }

  /**
   * Checks the user's session status with the identity service.
   * This is optimized to only run the HTTP request once per application load.
   */
  checkAuthStatus(): Promise<void> {
    // REMOVE: if (this.hasStatusBeenChecked) { return of(undefined); }
    return firstValueFrom(
      this.http.get<AuthStatusResponse>(`${this.identityServiceUrl}/api/auth/status`).pipe(
        tap({
          next: (response) => {
            if (response.authenticated && response.user?.token) {
              this.handleAuthentication(response.user, response.user.token);
            } else {
              this.clearAuthentication(false); // Pass false to prevent navigation loop
            }
          },
          error: () => this.clearAuthentication(false)
        }),
        map(() => void 0),
        catchError(() => {
          this.clearAuthentication(false);
          return of(undefined);
        })
      )
    );
  }

  private clearAuthentication(navigate = true): void {
    this.jwtToken = null;
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Logs the user out by calling the identity service endpoint and clearing local state.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.identityServiceUrl}/api/auth/logout`, {}).pipe(
      tap(() => this.clearAuthentication()),
      catchError((error) => {
        console.error('[AuthService] Logout failed, clearing state locally:', error);
        this.clearAuthentication(); // Ensure local state is cleared even if backend call fails
        return of(undefined);
      })
    );
  }

  /** Returns the current JWT. This is used by the HttpInterceptor. */
  getToken(): string | null {
    return this.jwtToken;
  }

  /** Centralized method to handle a successful authentication event. */
  private handleAuthentication(user: UserProfile, token: string): void {
    this.jwtToken = token;
    this.isAuthenticated.set(true);
    this.currentUser.set(user);
    localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
  }

}

