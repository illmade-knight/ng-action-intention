import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {firstValueFrom, Observable} from 'rxjs';

import { environment } from '../config/environment';
import type { AddressBookContact } from '../models/user';
import type { SecureEnvelope } from '@illmade-knight/action-intention-protos';
import { ClientService } from './client-service';
import { AuthService } from './auth';
import {UserLookupService} from './user-lookup.service';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private messagingServiceUrl = environment.messagingServiceUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private clientService = inject(ClientService);
  private userLookupService = inject(UserLookupService);

  /**
   * Fetches the logged-in user's address book from the messaging service.
   */
  getAddressBook(): Observable<AddressBookContact[]> {
    return this.http.get<AddressBookContact[]>(`${this.messagingServiceUrl}/api/address-book`);
  }

  /**
   * Orchestrates the process of sending a secure message.
   */
  async sendMessage(recipientId: string, plaintext: string): Promise<void> {
    const sender = this.authService.currentUser();
    if (!sender) {
      throw new Error('Cannot send message: no authenticated user.');
    }
    // Delegate the actual cryptographic and network operations to the KeyManagementService.
    return this.clientService.sendMessage(sender.id, recipientId, plaintext);
  }

  /**
   * Orchestrates the process of checking for and decrypting messages.
   */
  async getAndDecryptMessages(): Promise<{ from: string, message: string } | null> {
    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('Cannot check messages: no authenticated user.');
    }

    // 1. Fetch the raw encrypted messages.
    const messages: SecureEnvelope[] = await this.clientService.getMessages(user.id);

    if (messages.length === 0) {
      return null; // Return null to indicate no new messages.
    }

    // 2. Decrypt the first message.
    const firstMessage = messages[0];

    console.log("user id", user)
    const userKeys = await this.clientService.getOrCreateKeys(user.id);

    if (userKeys.privateKey) {
      const privateKeyBytes = await crypto.subtle.exportKey('jwk', userKeys.privateKey);
      console.debug(`[DEBUG] Retrieved private key length: ${JSON.stringify(privateKeyBytes).length} bytes`);
    }

    if (userKeys.publicKey) {
      const publicKeyBytes = await crypto.subtle.exportKey('spki', userKeys.publicKey);
      console.debug(`[DEBUG] Retrieved public key length: ${publicKeyBytes.byteLength} bytes`);
    }

    const decryptedText = await this.clientService.decryptMessage(userKeys.privateKey, firstMessage);

    return {
      from: firstMessage.senderId.toString(),
      message: decryptedText
    };
  }

  /**
   * Adds a new contact to the user's address book.
   * This would call your backend endpoint that performs the enrichment.
   * @param email The email of the contact to add.
   */
  addContactByEmail(email: string): Promise<void> {
    // This will call your new (conceptual) endpoint in the Go messaging-service
    const url = `${this.messagingServiceUrl}/api/address-book`;
    return firstValueFrom(this.http.post<void>(url, { email }));
  }
}
