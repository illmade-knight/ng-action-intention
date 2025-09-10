import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css'
})
export class NavigationComponent {}
