// in: src/app/services/client-service.ts

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Crypto, // Imported from the library
  EncryptedPayload, // Imported from the library
  StorageProvider, // Imported from the library
} from 'ts-action-intention';
import { URN, SecureEnvelope } from '@illmade-knight/action-intention-protos';
import { AngularKeyClient, AngularRoutingClient } from './ng-clients';
import { IndexedDbProvider } from './indexed-db-provider'; // Our new provider

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private http = inject(HttpClient);
  // Use the StorageProvider for ALL local data, which is our IndexedDbProvider
  private storageProvider: StorageProvider = inject(IndexedDbProvider);
  // Use the Crypto class from the library for all crypto operations
  private crypto = new Crypto();

  // These clients remain the same as they handle network communication
  private keyClient = new AngularKeyClient(this.http);
  private routingClient = new AngularRoutingClient(this.http);

  /**
   * Checks if cryptographic keys for a given user are stored locally.
   * Delegates directly to the storage provider.
   */
  async checkForLocalKeys(userId: string): Promise<boolean> {
    const keys = await this.storageProvider.loadKeyPair(userId);
    return !!keys;
  }

  /**
   * Retrieves existing keys from storage or generates new ones if none are found.
   * All local storage interaction is now handled by the provider.
   */
  async getOrCreateKeys(userId: string): Promise<CryptoKeyPair> {
    const existingKeys = await this.storageProvider.loadKeyPair(userId);
    if (existingKeys) {
      console.debug(`[DEBUG] Retrieved existing keys for userId: ${userId}`);
      if (existingKeys.privateKey) {
        const privateKeyBytes = await crypto.subtle.exportKey('jwk', existingKeys.privateKey);
        console.debug(`[DEBUG] Loaded private key length: ${JSON.stringify(privateKeyBytes).length} bytes`);
      }
      if (existingKeys.publicKey) {
        const publicKeyBytes = await crypto.subtle.exportKey('spki', existingKeys.publicKey);
        console.debug(`[DEBUG] Loaded public key length: ${publicKeyBytes.byteLength} bytes`);
      }
      return existingKeys;
    }
    return this.generateAndStoreKeys(userId);
  }

  /**
   * Generates a new key pair, stores it locally via the provider,
   * and uploads the public key to the server.
   */
  async generateAndStoreKeys(userId: string): Promise<CryptoKeyPair> {
    const keyPair = await this.crypto.generateEncryptionKeys(); // Uses library method
    if (keyPair.privateKey) {
      const privateKeyBytes = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
      console.debug(`[DEBUG] Generated private key length: ${JSON.stringify(privateKeyBytes).length} bytes`);
    }

    if (keyPair.publicKey) {
      const publicKeyBytes = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      console.debug(`[DEBUG] Generated public key length: ${publicKeyBytes.byteLength} bytes`);
    }
    await this.storageProvider.saveKeyPair(userId, keyPair); // Uses provider method

    const publicKeyBytes = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const userUrn = URN.create('user', userId);
    await this.keyClient.storeKey(userUrn, new Uint8Array(publicKeyBytes));

    return keyPair;
  }

  /**
   * Deletes a user's keys from local storage.
   */
  async deleteLocalKeys(userId: string): Promise<void> {
    await this.storageProvider.deleteKeyPair(userId);
  }

  /**
   * Encrypts and sends a message to a recipient.
   * The core logic remains but now uses the library's crypto class.
   */
  async sendMessage(senderId: string, recipientId: string, plaintext: string): Promise<void> {
    const recipientUrn = URN.create('user', recipientId);
    const publicKeyBytes = await this.keyClient.getKey(recipientUrn);

    const publicKey = await crypto.subtle.importKey('spki', new Uint8Array(publicKeyBytes), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);

    const encodedText = new TextEncoder().encode(plaintext);
    // Uses the library's encrypt method
    const payload: EncryptedPayload = await this.crypto.encrypt(publicKey, encodedText);

    const envelope: SecureEnvelope = {
      senderId: URN.create('user', senderId),
      recipientId: recipientUrn,
      messageId: crypto.randomUUID(),
      encryptedSymmetricKey: payload.encryptedSymmetricKey,
      encryptedData: payload.encryptedData,
      signature: new Uint8Array(), // Signature implementation is separate
    };

    await this.routingClient.send(envelope);
  }

  /**
   * Fetches any pending encrypted messages for the user.
   */
  async getMessages(userEmail: string): Promise<SecureEnvelope[]> {
    const userUrn = URN.create('user', userEmail);
    return this.routingClient.receive(userUrn);
  }

  /**
   * Decrypts a received secure envelope using the library's crypto class.
   */
  async decryptMessage(privateKey: CryptoKey, envelope: SecureEnvelope): Promise<string> {
    // Uses the library's decrypt method
    if (privateKey) {
      const privateKeyBytes = await crypto.subtle.exportKey('jwk', privateKey);
      console.debug(`[DEBUG] Retrieved private key length: ${JSON.stringify(privateKeyBytes).length} bytes`);
    }
    const sk = new Uint8Array(envelope.encryptedSymmetricKey)
    const ed = new Uint8Array(envelope.encryptedData)
    console.log("key length", sk.length)
    const decryptedBytes = await this.crypto.decrypt(privateKey, sk, ed);
    return new TextDecoder().decode(decryptedBytes);
  }
}
