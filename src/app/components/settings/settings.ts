import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ClientService } from '../../services/client-service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './settings.html',
})
export class SettingsComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  keyStatus = signal<'checking' | 'found' | 'missing'>('checking');
  currentUser = this.authService.currentUser;

  // For debug panel
  keyCheckResult: boolean | null = null;

  ngOnInit(): void {
    this.checkForKey();
  }

  async checkForKey(): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      this.keyStatus.set('missing');
      return;
    }

    this.keyStatus.set('checking');
    this.keyCheckResult = null;
    // CORRECTED: Use user.email as the identifier
    const keysExist = await this.clientService.checkForLocalKeys(user.email);
    this.keyCheckResult = keysExist;
    this.keyStatus.set(keysExist ? 'found' : 'missing');
  }

  async generateKeys(): Promise<void> {
    const user = this.currentUser();
    if (!user) {
      alert('You must be logged in to generate keys.');
      return;
    }

    this.keyStatus.set('checking');
    try {
      // CORRECTED: Use user.email as the identifier
      await this.clientService.generateAndStoreKeys(user.email);
      this.keyStatus.set('found');
      // Re-run the check to update the UI state
      await this.checkForKey();
    } catch (error: any) {
      console.error("Key generation failed:", error);
      // CORRECTED: Use user.email as the identifier
      await this.clientService.deleteLocalKeys(user.email);
      this.keyStatus.set('missing');
      this.keyCheckResult = false;
      alert(`Key generation failed: ${error.message}`);
    }
  }
}

