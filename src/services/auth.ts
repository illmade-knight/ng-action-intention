// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from './auth.config'; // <-- Import the config

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private oauthService: OAuthService) {
    this.configure();
  }

  private configure(): void {
    // 1. Configure the library
    this.oauthService.configure(authCodeFlowConfig);

    // 2. Load the discovery document and try to log in
    // This is done automatically on app load.
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  public login(): void {
    // This initiates the login flow, redirecting the user to Google
    this.oauthService.initCodeFlow();
  }

  public logout(): void {
    this.oauthService.logOut();
  }

  public get isLoggedIn(): boolean {
    return this.oauthService.hasValidIdToken();
  }

  public get userProfile(): object | null {
    const claims = this.oauthService.getIdentityClaims();
    return claims ? claims : null;
  }
}
