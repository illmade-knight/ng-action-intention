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
import type { AddressBookContact } from '../../models/user';
import { SecureEnvelope } from 'ts-action-intention';

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

  // Component State
  currentUser = this.authService.currentUser;
  addressBook = signal<AddressBookContact[]>([]);

  // Form Models
  recipientEmail: string | null = null;
  messageToSend = '';

  // UI Feedback
  statusLog = signal('Ready.');
  decryptedMessage = signal('');

  async ngOnInit(): Promise<void> {
    this.statusLog.set('Fetching address book...');
    try {
      const book = await firstValueFrom(this.authService.getAddressBook());
      this.addressBook.set(book);
      this.statusLog.set('Address book loaded.');
    } catch (error) {
      this.statusLog.set('Error: Could not load address book.');
      console.error(error);
    }
  }

  async sendMessage(): Promise<void> {
    const sender = this.currentUser();
    if (!sender || !this.recipientEmail || !this.messageToSend) {
      this.statusLog.set('Error: Sender, recipient, and message must be set.');
      return;
    }

    this.statusLog.set(`Sending message to ${this.recipientEmail}...`);
    try {
      await this.clientService.sendMessage(sender.email, this.recipientEmail, this.messageToSend);
      this.statusLog.set(`Message sent to ${this.recipientEmail} successfully!`);
      this.messageToSend = '';
    } catch (error: any) {
      this.statusLog.set(`Error sending message: ${error.message}`);
      console.error(error);
    }
  }

  async checkMessages(): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      this.statusLog.set('Error: You must be logged in to check messages.');
      return;
    }

    this.statusLog.set('Checking for messages...');
    try {
      const messages: SecureEnvelope[] = await this.clientService.getMessages(user.email);

      if (messages.length > 0) {
        this.statusLog.set(`Found ${messages.length} new message(s). Decrypting first one...`);
        const firstMessage = messages[0];
        const userKeys = await this.clientService.getOrCreateKeys(user.email);
        const decrypted = await this.clientService.decryptMessage(userKeys.privateKey, firstMessage);
        this.decryptedMessage.set(decrypted);
        this.statusLog.set(`Decrypted a message from ${firstMessage.senderId.toString()}.`);
      } else {
        // This is the correct, normal, successful state for an empty inbox.
        this.statusLog.set('No new messages found.');
        this.decryptedMessage.set('');
      }
    } catch (error: any) {
      // CORRECTED: This block now handles only genuine errors.
      // It provides clear feedback to the user and logs the technical details
      // for the developer, without conflating the error with an empty inbox.
      this.statusLog.set('Error: Could not retrieve messages from the server.');
      this.decryptedMessage.set('');
      console.error('An error occurred while fetching messages:', error);
    }
  }
}

