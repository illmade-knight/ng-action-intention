import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../config/environment';
import type { AddressBookContact } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserLookupService {
  private http = inject(HttpClient);
  private identityServiceUrl = environment.identityServiceUrl;

  /**
   * Finds a user by their email address via the identity service.
   * @param email The email to look up.
   * @returns A promise that resolves to the user's public profile or null.
   */
  findByEmail(email: string): Promise<AddressBookContact | null> {
    return firstValueFrom(
      this.http.get<AddressBookContact>(`${this.identityServiceUrl}/api/users/by-email/${email}`)
    );
  }
}
