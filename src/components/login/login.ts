import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {AuthService} from '../../services/auth';
import {JsonPipe} from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-user-selection',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [RouterLink, MatButtonModule, JsonPipe]
})
export class Login {
  constructor(private authService: AuthService) {}

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }

  get userProfile() {
    return this.authService.userProfile;
  }
}
