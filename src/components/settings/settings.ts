import {Component, OnInit} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { KeyManagementService } from '../../services/key-management';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {MatDivider} from '@angular/material/divider';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatButton,
    CommonModule,
    RouterLink,
    MatDivider,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class SettingsComponent implements OnInit {
  keyStatus: 'checking' | 'found' | 'missing' = 'checking';
  userId!: string;
  keyCheckResult: boolean | null = null;

  constructor(
    private keyService: KeyManagementService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.userId = id;
        this.checkForKey();
      }
    });
  }

  async checkForKey() {
    if (!this.userId) return;
    this.keyStatus = 'checking';
    this.keyCheckResult = null;
    const keysExist = await this.keyService.checkForLocalKeys(this.userId);
    this.keyCheckResult = keysExist;
    this.keyStatus = keysExist ? 'found' : 'missing';
  }

  async generateKeys() {
    if (!this.userId) return;
    this.keyStatus = 'checking';
    try {
      await this.keyService.generateAndStoreKeys(this.userId);
      this.keyStatus = 'found';
      await this.checkForKey();
    } catch (error: any) {
      console.error("Key generation failed:", error);
      // Ensure stale keys are cleared on failure
      await this.keyService.deleteLocalKeys(this.userId);
      this.keyStatus = 'missing';
      this.keyCheckResult = false;
      alert(`Key generation failed: ${error.message}`);
    }
  }
}
