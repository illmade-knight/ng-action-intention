import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, of } from 'rxjs';
import { Router } from '@angular/router';
import { AddressBookContact, UserProfile } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private backendUrl = 'http://localhost:3000';
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals to hold the authentication state
  isAuthenticated: WritableSignal<boolean> = signal(false);
  currentUser: WritableSignal<UserProfile | null> = signal(null);

  // Private state to track if the initial auth check has been performed
  private hasStatusBeenChecked = false;

  /**
   * Checks the user's authentication status with the backend.
   * This is optimized to only run the HTTP request once per session.
   */
  checkAuthStatus(): Observable<void> {
    // If we've already checked, return an observable that completes immediately.
    if (this.hasStatusBeenChecked) {
      return of(undefined);
    }

    return this.http.get<any>(`${this.backendUrl}/api/auth/status`).pipe(
      tap({
        next: (response) => {
          this.isAuthenticated.set(response.authenticated);
          this.currentUser.set(response.user);
          this.hasStatusBeenChecked = true; // Mark as checked
        },
        error: (error) => {
          this.isAuthenticated.set(false);
          this.currentUser.set(null);
          this.hasStatusBeenChecked = true; // Mark as checked even on error
        }
      }),
      map(() => void 0) // Convert the result to void
    );
  }

  /**
   * Logs the user out by calling the backend endpoint.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.backendUrl}/api/auth/logout`, {}).pipe(
      tap(() => {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.hasStatusBeenChecked = true; // The status is now known (logged out)
        this.router.navigate(['/login']);
      })
    );
  }

  /**
   * Fetches the logged-in user's address book from the backend.
   */
  getAddressBook(): Observable<AddressBookContact[]> {
    return this.http.get<AddressBookContact[]>(`${this.backendUrl}/api/user/address-book`);
  }
}
