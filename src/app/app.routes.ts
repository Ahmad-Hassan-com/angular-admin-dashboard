import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/auth/guards';

// Everything, including the shell, is lazy-loaded so the initial bundle is just the framework + router.
export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell'),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · Admin',
        loadComponent: () => import('./features/dashboard/dashboard'),
      },
      {
        path: 'users',
        canMatch: [roleGuard('admin')],
        loadChildren: () => import('./features/users/users.routes'),
      },
      {
        path: 'profile',
        title: 'Profile · Admin',
        loadComponent: () => import('./features/profile/profile'),
      },
      {
        path: 'forbidden',
        title: 'Access denied · Admin',
        loadComponent: () => import('./features/errors/forbidden'),
      },
    ],
  },
  {
    path: '**',
    title: 'Not found · Admin',
    loadComponent: () => import('./features/errors/not-found'),
  },
];
