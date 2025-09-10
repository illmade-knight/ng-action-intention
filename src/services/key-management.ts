// in ng-action-intention/src/app/services/key-management.service.ts

import { Injectable } from '@angular/core';
import {
  Crypto,
  KeyClientImpl,
  RoutingClientImpl,
  LocalStorageKeyStore,
  SecureEnvelope,
  EncryptedPayload,
} from 'ts-action-intention';

@Injectable({
  providedIn: 'root',
})
export class KeyManagementService {
  private crypto = new Crypto();
  private keyStore = new LocalStorageKeyStore();
  private keyClient = new KeyClientImpl('http://localhost:8081');
  private routingClient = new RoutingClientImpl('http://localhost:8082');

  async checkForLocalKeys(userId: string): Promise<boolean> {
    console.log(`[KeyManagementService] 1. Calling keyStore.loadKeyPair for user: ${userId}`);
    const storageKey = `crypto_keys_${userId}`;
    const storedValue = localStorage.getItem(storageKey);

    console.log(`[KeyManagementService] 2. Raw value from localStorage for key "${storageKey}":`, storedValue);

    // This replicates the keyStore logic with logging
    if (!storedValue) {
      console.log(`[KeyManagementService] 3. Value is falsy. Returning false.`);
      return false;
    }

    try {
      // We try to parse it to see if it's valid
      JSON.parse(storedValue);
      console.log(`[KeyManagementService] 3. Value is truthy and valid JSON. Returning true.`);
      return true;
    } catch (e) {
      console.log(`[KeyManagementService] 3. Value is truthy but INVALID JSON. Returning false.`);
      return false;
    }
  }

  async getOrCreateKeys(userId: string): Promise<CryptoKeyPair> {
    const existingKeys = await this.keyStore.loadKeyPair(userId);
    if (existingKeys) {
      return existingKeys;
    }
    return this.generateAndStoreKeys(userId);
  }

  async generateAndStoreKeys(userId:string): Promise<CryptoKeyPair> {
    const keyPair = await this.crypto.generateEncryptionKeys();
    await this.keyStore.saveKeyPair(userId, keyPair);
    const publicKeyBytes = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    await this.keyClient.storeKey(userId, new Uint8Array(publicKeyBytes));
    return keyPair;
  }

  /**
   * ADDED: This method exposes the delete functionality for use in components.
   */
  async deleteLocalKeys(userId: string): Promise<void> {
    await this.keyStore.deleteKeyPair(userId);
  }

  async sendMessage(senderId: string, recipientId: string, plaintext: string) {
    const publicKeyBytes = await this.keyClient.getKey(recipientId);
    const kBuffer = new Uint8Array(publicKeyBytes)
    const publicKey = await crypto.subtle.importKey(
      'spki',
      kBuffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
    const encodedText = new TextEncoder().encode(plaintext);
    const payload: EncryptedPayload = await this.crypto.encrypt(publicKey, encodedText);
    const signature = '';
    const envelope: SecureEnvelope = {
      senderId: senderId,
      recipientId: recipientId,
      encryptedSymmetricKey: this.uint8ArrayToBase64(payload.encryptedSymmetricKey),
      encryptedData: this.uint8ArrayToBase64(payload.encryptedData),
      signature: signature,
    };
    await this.routingClient.send(envelope);
  }

  async getMessages(userId: string): Promise<SecureEnvelope[]> {
    return this.routingClient.receive(userId);
  }

  async decryptMessage(privateKey: CryptoKey, envelope: SecureEnvelope): Promise<string> {
    const encryptedSymmetricKey = this.base64ToUint8Array(envelope.encryptedSymmetricKey);
    const encryptedData = this.base64ToUint8Array(envelope.encryptedData);
    const decryptedBytes = await this.crypto.decrypt(privateKey, encryptedSymmetricKey, encryptedData);
    return new TextDecoder().decode(decryptedBytes);
  }

  private uint8ArrayToBase64(buffer: Uint8Array): string {
    return btoa(String.fromCharCode.apply(null, Array.from(buffer)));
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
