import { Routes } from '@angular/router';
import { Login } from '../components/login/login';
import { Messaging } from '../components/messaging/messaging';
import {SettingsComponent} from '../components/settings/settings';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'user/messaging/:id', component: Messaging },
  { path: 'user/settings/:id', component: SettingsComponent }
];
