// in: src/app/services/indexed-db-provider.ts

import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import {
  StorageProvider,
  FileManifest, // These are all imported from your library
  ApplicationState,
} from 'ts-action-intention';

// Define the structure for the key pair records in IndexedDB
export interface KeyPairRecord {
  id: string; // User's unique ID
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

// Define the structure for the application state record
export interface AppStateRecord {
  id: string; // The 'path' or unique key for the state
  state: ApplicationState;
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbProvider extends Dexie implements StorageProvider {
  private keyPairs!: Table<KeyPairRecord, string>;
  private appStates!: Table<AppStateRecord, string>;

  constructor() {
    super('ActionIntentionDB'); // Database name
    this.version(1).stores({
      keyPairs: 'id', // Table for crypto keys, indexed by user ID
      appStates: 'id', // Table for app state, indexed by path
    });
  }

  // --- Key Management Implementation ---

  async saveKeyPair(userId: string, keyPair: CryptoKeyPair): Promise<void> {
    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    await this.keyPairs.put({ id: userId, publicKey, privateKey });
  }

  async loadKeyPair(userId: string): Promise<CryptoKeyPair | null> {
    const record = await this.keyPairs.get(userId);
    if (!record) return null;

    try {
      const publicKey = await crypto.subtle.importKey('jwk', record.publicKey, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
      const privateKey = await crypto.subtle.importKey('jwk', record.privateKey, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
      return { publicKey, privateKey };
    } catch (error) {
      console.error('Failed to import stored key, deleting corrupted record:', error);
      await this.keyPairs.delete(userId);
      return null;
    }
  }

  async deleteKeyPair(userId: string): Promise<void> {
    await this.keyPairs.delete(userId);
  }

  // --- App State Management (currently stubs, but shows the pattern) ---

  async getManifest(path: string): Promise<FileManifest | null> {
    // This logic would be implemented if the app state were also moved to IndexedDB
    console.warn('getManifest is not yet implemented for IndexedDbProvider');
    return null;
  }

  async readFile(path: string): Promise<ApplicationState> {
    // This logic would be implemented if the app state were also moved to IndexedDB
    const record = await this.appStates.get(path);
    if (!record) throw new Error('State not found in IndexedDB');
    return record.state;
  }

  async writeFile(path: string, state: ApplicationState): Promise<void> {
    // This logic would be implemented if the app state were also moved to IndexedDB
    await this.appStates.put({ id: path, state });
  }
}
