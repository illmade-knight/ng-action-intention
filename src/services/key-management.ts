import { Injectable } from '@angular/core';
import {
  Crypto,
  KeyClientImpl,
  RoutingClientImpl,
  LocalStorageKeyStore,
  SecureEnvelope,
  EncryptedPayload,
  URN,
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
    const storageKey = `crypto_keys_${userId}`;
    const storedValue = localStorage.getItem(storageKey);
    if (!storedValue) { return false; }
    try {
      JSON.parse(storedValue);
      return true;
    } catch (e) {
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

  async generateAndStoreKeys(userId: string): Promise<CryptoKeyPair> {
    const keyPair = await this.crypto.generateEncryptionKeys();
    await this.keyStore.saveKeyPair(userId, keyPair);
    const publicKeyBytes = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const userUrn = URN.create('user', userId);
    await this.keyClient.storeKey(userUrn, new Uint8Array(publicKeyBytes));
    return keyPair;
  }

  async deleteLocalKeys(userId: string): Promise<void> {
    await this.keyStore.deleteKeyPair(userId);
  }

  async sendMessage(senderId: string, recipientId: string, plaintext: string): Promise<void> {
    const senderUrn = URN.create('user', senderId);
    const recipientUrn = URN.create('user', recipientId);

    const publicKeyBytes = await this.keyClient.getKey(recipientUrn);
    const publicKey = await crypto.subtle.importKey(
      'spki',
      new Uint8Array(publicKeyBytes),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );

    const encodedText = new TextEncoder().encode(plaintext);
    const payload: EncryptedPayload = await this.crypto.encrypt(publicKey, encodedText);
    const signature = new Uint8Array(); // Placeholder for a real signature

    // THE FIX: Create a plain JavaScript object for the network call.
    // All fields are explicitly converted to the string format the backend expects.
    const networkEnvelope = {
      senderId: senderUrn.toString(),
      recipientId: recipientUrn.toString(),
      messageId: crypto.randomUUID(), // Add the missing messageId
      encryptedSymmetricKey: this.uint8ArrayToBase64(payload.encryptedSymmetricKey),
      encryptedData: this.uint8ArrayToBase64(payload.encryptedData),
      signature: this.uint8ArrayToBase64(signature),
    };

    // The library's `send` method expects a SecureEnvelope, but we must send
    // the network-compatible format. The `as any` cast is necessary here.
    await this.routingClient.send(networkEnvelope as any);
  }

  async getMessages(userId: string): Promise<SecureEnvelope[]> {
    const userUrn = URN.create('user', userId);
    const rawMessages: any[] = await this.routingClient.receive(userUrn);

    const validMessages: SecureEnvelope[] = [];
    for (const raw of rawMessages) {
      try {
        if (!raw.senderId || !raw.recipientId) {
          console.warn('Skipping message with missing sender/recipient ID', raw);
          continue;
        }
        const senderId = URN.parse(raw.senderId);
        const recipientId = URN.parse(raw.recipientId);
        if (!senderId || !recipientId) {
          console.warn('Skipping message with invalid URN', raw);
          continue;
        }
        validMessages.push({
          senderId: senderId,
          recipientId: recipientId,
          messageId: raw.messageId,
          encryptedSymmetricKey: this.base64ToUint8Array(raw.encryptedSymmetricKey),
          encryptedData: this.base64ToUint8Array(raw.encryptedData),
          signature: this.base64ToUint8Array(raw.signature),
        });
      } catch (error) {
        console.warn('Failed to parse a received message, skipping.', { rawMessage: raw, error });
      }
    }
    return validMessages;
  }

  async decryptMessage(privateKey: CryptoKey, envelope: SecureEnvelope): Promise<string> {
    const decryptedBytes = await this.crypto.decrypt(
      privateKey,
      envelope.encryptedSymmetricKey,
      envelope.encryptedData
    );
    return new TextDecoder().decode(decryptedBytes);
  }

  // --- Base64 Helper Methods ---
  private uint8ArrayToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

