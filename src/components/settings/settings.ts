// In settings.ts

import {Component, OnInit} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { KeyManagementService } from '../../services/key-management';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {MatDivider} from '@angular/material/divider'; // Import ActivatedRoute and RouterLink

@Component({
  selector: 'app-settings',
  imports: [
    MatButton,
    CommonModule,
    RouterLink,
    MatDivider,
    // Add RouterLink to imports
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  keyStatus: 'checking' | 'found' | 'missing' = 'checking';
  userId!: string; // Remove the hardcoded 'alice'

  keyCheckResult: boolean | null = null;
  // Inject ActivatedRoute
  constructor(
    private keyService: KeyManagementService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read the user ID from the URL
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id') as string;
      this.checkForKey();
    });
  }

  async checkForKey() {
    this.keyStatus = 'checking';
    this.keyCheckResult = null; // Reset for each check

    // ADD LOGGING AND STORE THE RAW RESULT
    const keysExist = await this.keyService.checkForLocalKeys(this.userId);
    console.log(`[settings.ts] Raw result from keyService.checkForLocalKeys:`, keysExist);
    this.keyCheckResult = keysExist; // Store for the UI

    this.keyStatus = keysExist ? 'found' : 'missing';
  }

  async generateKeys() {
    this.keyStatus = 'checking';
    try {
      await this.keyService.generateAndStoreKeys(this.userId);
      this.keyStatus = 'found';
      // Re-run the check to update the debug panel after generation
      await this.checkForKey();
    } catch (e) {
      console.error("Key generation failed:", e);
      await this.keyService.deleteLocalKeys(this.userId);
      this.keyStatus = 'missing';
      this.keyCheckResult = false;
    }
  }
}
