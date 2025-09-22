import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ClientService } from '../../services/client-service';
import { AuthService } from '../../services/auth';
import { MessagingService } from '../../services/messaging-service'; // Import the new service
import type { AddressBookContact } from '../../models/user';
import { SecureEnvelope  } from '@illmade-knight/action-intention-protos';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './messaging.html',
})
export class MessagingComponent implements OnInit {
  private authService = inject(AuthService);
  private clientService = inject(ClientService);
  private messagingService = inject(MessagingService); // Inject the new service

  // Component State
  currentUser = this.authService.currentUser;
  addressBook = signal<AddressBookContact[]>([]);

  // Form Models
  recipientEmail: string | null = null;
  recipientId: string | null = null;
  messageToSend = '';
  newContactEmail = '';

  // UI Feedback
  statusLog = signal('Ready.');
  decryptedMessage = signal('');

  async ngOnInit(): Promise<void> {
    this.statusLog.set('Fetching address book...');
    try {
      // CORRECTED: Use the new messagingService to get the address book.
      const book = await firstValueFrom(this.messagingService.getAddressBook());
      this.addressBook.set(book);
      this.statusLog.set('Address book loaded.');
    } catch (error) {
      this.statusLog.set('Error: Could not load address book.');
      console.error(error);
    }
  }

  async sendMessage(): Promise<void> {
    const sender = this.currentUser();
    // 1. First, validate the application state (is a user logged in?)
    if (!sender) {
      this.statusLog.set('Error: Cannot send message. User is not authenticated.');
      console.error('sendMessage called but currentUser is null. This should not happen if the authGuard is working.');
      return;
    }

    // 2. Second, validate the user's form input.
    if (!this.recipientId || !this.messageToSend) {
      this.statusLog.set('Error: A recipient and message must be provided.');
      return;
    }

    this.statusLog.set(`Sending message...`);
    try {
      await this.messagingService.sendMessage(this.recipientId, this.messageToSend);
      this.statusLog.set(`Message sent successfully!`);
      this.messageToSend = '';
    } catch (error: any) {
      this.statusLog.set(`Error sending message: ${error.message}`);
      console.error(error);
    }
  }

  async checkMessages(): Promise<void> {
    this.statusLog.set('Checking for messages...');
    try {
      // Await the result, which will be an object or null.
      const decryptedResult = await this.messagingService.getAndDecryptMessages();

      // Check if the result is not null.
      if (decryptedResult) {
        this.decryptedMessage.set(decryptedResult.message);
        this.statusLog.set(`Decrypted a message from ${decryptedResult.from}.`);
      } else {
        this.statusLog.set('No new messages found.');
        this.decryptedMessage.set('');
      }
    } catch (error: any) {
      this.statusLog.set('Error: Could not retrieve or decrypt messages.');
      this.decryptedMessage.set('');
      console.error('An error occurred while fetching messages:', error);
    }
  }

  async addContact(): Promise<void> {
    if (!this.newContactEmail) {
      this.statusLog.set('Please enter an email to add.');
      return;
    }
    this.statusLog.set(`Adding contact ${this.newContactEmail}...`);
    try {
      await this.messagingService.addContactByEmail(this.newContactEmail);
      this.statusLog.set(`Contact ${this.newContactEmail} added successfully! Reloading address book...`);
      this.newContactEmail = '';
      // Refresh the address book to show the new contact
      await this.ngOnInit();
    } catch (error) {
      this.statusLog.set(`Error: Could not add contact.`);
      console.error(error);
    }
  }
}

