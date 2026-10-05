import type { Routes } from '@angular/router';
import { Favorites } from '../favorites/favorites.ts';
import { Home } from './home.ts';

export const HOME_ROUTES: Routes = [
  { path: '', component: Home },
  { path: 'favorites', component: Favorites },
];
