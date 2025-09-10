import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {NavigationComponent} from '../components/navigation/navigation';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [
    CommonModule,
    RouterOutlet,
    NavigationComponent
  ]
})
export class AppComponent {
  title = 'action-intention-demo';
}
