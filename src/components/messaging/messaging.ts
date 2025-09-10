import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select'; // New import
import {FormsModule} from '@angular/forms';
import {SecureEnvelope} from 'ts-action-intention';

import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';

import {KeyManagementService} from '../../services/key-management';

@Component({
  standalone: true,
  selector: 'app-user-interface',
  templateUrl: './messaging.html',
  styleUrls: ['./messaging.css'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule, // Add MatSelectModule
    FormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    RouterLink,
  ]
})
export class Messaging implements OnInit {
  userId!: string;
  recipientId!: string;
  userKeys!: CryptoKeyPair;
  messageToSend: string = '';
  statusLog: string = 'Ready.';
  decryptedMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private keyManagementService: KeyManagementService // Inject the service
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id') as string;
      this.recipientId = this.userId === 'alice' ? 'bob' : 'alice';
      this.initializeUser();
    });
  }

  async initializeUser() {
    this.statusLog = 'Initializing user and keys...';
    try {
      this.userKeys = await this.keyManagementService.getOrCreateKeys(this.userId);
      this.statusLog = 'User and keys initialized successfully.';
    } catch (error) {
      this.statusLog = `Error initializing keys: ${error}`;
      console.error(error);
    }
  }

  async sendMessage() {
    this.statusLog = `Sending message to ${this.recipientId}...`;
    try {
      await this.keyManagementService.sendMessage(this.userId, this.recipientId, this.messageToSend);
      this.statusLog = `Message sent to ${this.recipientId} successfully!`;
      this.messageToSend = '';
    } catch (error) {
      this.statusLog = `Error sending message: ${error}`;
      console.error(error);
    }
  }

  async checkMessages() {
    this.statusLog = 'Checking for messages...';
    try {
      const messages: SecureEnvelope[] = await this.keyManagementService.getMessages(this.userId);
      if (messages.length > 0) {
        const firstMessage = messages[0];
        const privateKey = this.userKeys.privateKey;
        // CORRECTED: Pass the whole envelope to the service for decryption
        this.decryptedMessage = await this.keyManagementService.decryptMessage(privateKey, firstMessage);
        this.statusLog = `Decrypted a message.`;
      } else {
        this.statusLog = 'No new messages.';
      }
    } catch (error) {
      this.statusLog = `Error checking for messages: ${error}`;
      console.error(error);
    }
  }
}
