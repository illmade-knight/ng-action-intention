import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-user-selection',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [RouterLink, MatButtonModule]
})
export class Login {}
